const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const { program } = require('commander');

const WorkflowDatabase = require('./database');

// Initialize Express app
const app = express();
const db = new WorkflowDatabase();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../static')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'N8N Workflow API is running' });
});

// Main page
app.get('/', (req, res) => {
  const staticPath = path.join(__dirname, '../static/index.html');
  
  if (fs.existsSync(staticPath)) {
    res.sendFile(staticPath);
  } else {
    res.status(404).send(`
      <html><body>
        <h1>Setup Required</h1>
        <p>Static files not found. Please ensure the static directory exists with index.html</p>
        <p>Current directory: ${process.cwd()}</p>
      </body></html>
    `);
  }
});

// API Documentation page
app.get('/docs', (req, res) => {
  const docsPath = path.join(__dirname, '../static/api-docs.html');
  
  if (fs.existsSync(docsPath)) {
    res.sendFile(docsPath);
  } else {
    res.status(404).send(`
      <html><body>
        <h1>Documentation Not Found</h1>
        <p>API documentation page not found. Please ensure api-docs.html exists in the static directory.</p>
      </body></html>
    `);
  }
});

// API Routes

// API Documentation endpoint - redirect to formatted docs
app.get('/api/docs', (req, res) => {
  // Check if user wants JSON format
  const acceptHeader = req.get('Accept') || '';
  const userAgent = req.get('User-Agent') || '';
  
  // If it's a browser request or wants HTML, redirect to formatted docs
  if (acceptHeader.includes('text/html') || userAgent.includes('Mozilla')) {
    return res.redirect('/docs');
  }
  
  // Otherwise return JSON for API clients
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const apiDocs = {
    title: "N8N Workflows API Documentation",
    version: "1.0.0",
    description: "REST API for browsing and searching 2,055+ n8n automation workflows",
    message: "For formatted documentation, visit /docs",
    baseUrl: baseUrl,
    formatted_docs: `${baseUrl}/docs`,
    endpoints: {
      "Health Check": {
        method: "GET",
        path: "/health",
        description: "Check API health status"
      },
      "Get Statistics": {
        method: "GET", 
        path: "/api/stats",
        description: "Get workflow repository statistics"
      },
      "Search Workflows": {
        method: "GET",
        path: "/api/workflows",
        description: "Search and filter workflows",
        parameters: {
          q: "Search query string",
          trigger: "Filter by trigger type (all, manual, webhook, scheduled, complex)",
          complexity: "Filter by complexity (all, simple, medium, complex)",
          active_only: "Show only active workflows (true/false)",
          page: "Page number (default: 1)",
          per_page: "Results per page (1-100, default: 20)"
        },
        example: `${baseUrl}/api/workflows?q=telegram&trigger=webhook&per_page=10`
      },
      "Get Workflow Details": {
        method: "GET",
        path: "/api/workflows/:filename",
        description: "Get detailed information about a specific workflow",
        example: `${baseUrl}/api/workflows/0001_Telegram_Schedule_Automation_Scheduled.json`
      },
      "Download Workflow": {
        method: "GET", 
        path: "/api/workflows/:filename/download",
        description: "Download workflow JSON file"
      },
      "Get Workflow Diagram": {
        method: "GET",
        path: "/api/workflows/:filename/diagram", 
        description: "Get Mermaid diagram representation"
      },
      "Get All Integrations": {
        method: "GET",
        path: "/api/integrations",
        description: "Get sorted list of all 488 unique integrations"
      },
      "Get Categorized Workflows": {
        method: "GET",
        path: "/api/categories",
        description: "Get workflows organized by categories (Communication, CRM, Data, etc.)"
      },
      "Reindex Workflows": {
        method: "POST",
        path: "/api/reindex", 
        description: "Trigger workflow reindexing",
        body: { force: "boolean" }
      }
    }
  };
  
  res.json(apiDocs);
});

// Get workflow statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats', details: error.message });
  }
});

// Search workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const {
      q = '',
      trigger = 'all',
      complexity = 'all',
      active_only = false,
      page = 1,
      per_page = 20
    } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const perPage = Math.min(100, Math.max(1, parseInt(per_page)));
    const offset = (pageNum - 1) * perPage;
    const activeOnly = active_only === 'true';
    
    const { workflows, total } = await db.searchWorkflows(
      q, trigger, complexity, activeOnly, perPage, offset
    );
    
    const pages = Math.ceil(total / perPage);
    
    res.json({
      workflows,
      total,
      page: pageNum,
      per_page: perPage,
      pages,
      query: q,
      filters: {
        trigger,
        complexity,
        active_only: activeOnly
      }
    });
  } catch (error) {
    console.error('Error searching workflows:', error);
    res.status(500).json({ error: 'Error searching workflows', details: error.message });
  }
});

// Get workflow detail
app.get('/api/workflows/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const workflow = await db.getWorkflowDetail(filename);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow detail:', error);
    res.status(500).json({ error: 'Error fetching workflow detail', details: error.message });
  }
});

// Download workflow
app.get('/api/workflows/:filename/download', async (req, res) => {
  try {
    const { filename } = req.params;
    const workflowPath = path.join('workflows', filename);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow file not found' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.resolve(workflowPath));
  } catch (error) {
    console.error('Error downloading workflow:', error);
    res.status(500).json({ error: 'Error downloading workflow', details: error.message });
  }
});

// Get workflow diagram (Mermaid)
app.get('/api/workflows/:filename/diagram', async (req, res) => {
  try {
    const { filename } = req.params;
    const workflow = await db.getWorkflowDetail(filename);
    
    if (!workflow || !workflow.raw_workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const diagram = generateMermaidDiagram(workflow.raw_workflow.nodes, workflow.raw_workflow.connections);
    res.json({ diagram });
  } catch (error) {
    console.error('Error generating diagram:', error);
    res.status(500).json({ error: 'Error generating diagram', details: error.message });
  }
});

// Generate Mermaid diagram
function generateMermaidDiagram(nodes, connections) {
  if (!nodes || nodes.length === 0) {
    return 'graph TD\n    A[No nodes found]';
  }
  
  let diagram = 'graph TD\n';
  
  // Add nodes
  nodes.forEach(node => {
    const nodeId = sanitizeNodeId(node.name);
    const nodeType = node.type?.split('.').pop() || 'unknown';
    diagram += `    ${nodeId}["${node.name}\\n(${nodeType})"]\n`;
  });
  
  // Add connections
  if (connections) {
    Object.entries(connections).forEach(([sourceNode, outputs]) => {
      const sourceId = sanitizeNodeId(sourceNode);
      
      outputs.main?.forEach(outputConnections => {
        outputConnections.forEach(connection => {
          const targetId = sanitizeNodeId(connection.node);
          diagram += `    ${sourceId} --> ${targetId}\n`;
        });
      });
    });
  }
  
  return diagram;
}

function sanitizeNodeId(nodeName) {
  // Convert node name to valid Mermaid ID
  return nodeName.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
}

// Reindex workflows
app.post('/api/reindex', async (req, res) => {
  try {
    const { force = false } = req.body;
    
    // Run indexing in background
    db.indexWorkflows(force).then(results => {
      console.log('Indexing completed:', results);
    }).catch(error => {
      console.error('Indexing error:', error);
    });
    
    res.json({ message: 'Indexing started in background' });
  } catch (error) {
    console.error('Error starting reindex:', error);
    res.status(500).json({ error: 'Error starting reindex', details: error.message });
  }
});

// Get integrations
app.get('/api/integrations', async (req, res) => {
  try {
    const { workflows } = await db.searchWorkflows('', 'all', 'all', false, 1000, 0);
    
    const integrations = new Set();
    workflows.forEach(workflow => {
      workflow.integrations.forEach(integration => integrations.add(integration));
    });
    
    res.json(Array.from(integrations).sort());
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Error fetching integrations', details: error.message });
  }
});

// Get categories (based on integrations)
app.get('/api/categories', async (req, res) => {
  try {
    const { workflows } = await db.searchWorkflows('', 'all', 'all', false, 1000, 0);
    
    const categories = {
      'Communication': ['Slack', 'Discord', 'Telegram', 'Mattermost', 'Teams'],
      'CRM': ['HubSpot', 'Salesforce', 'Pipedrive', 'Copper'],
      'Data': ['GoogleSheets', 'Airtable', 'Mysql', 'Postgres'],
      'Development': ['GitHub', 'GitLab', 'Jira', 'Trello'],
      'Marketing': ['Mailchimp', 'Sendinblue', 'Typeform', 'Webflow'],
      'Storage': ['GoogleDrive', 'Dropbox', 'OneDrive', 'AWS S3'],
      'Other': []
    };
    
    // Categorize workflows
    const categorizedWorkflows = {};
    Object.keys(categories).forEach(category => {
      categorizedWorkflows[category] = [];
    });
    
    workflows.forEach(workflow => {
      let categorized = false;
      
      // Check each integration against categories
      workflow.integrations.forEach(integration => {
        Object.entries(categories).forEach(([category, services]) => {
          if (services.some(service => 
            integration.toLowerCase().includes(service.toLowerCase())
          )) {
            categorizedWorkflows[category].push(workflow);
            categorized = true;
          }
        });
      });
      
      // If not categorized, add to Other
      if (!categorized) {
        categorizedWorkflows['Other'].push(workflow);
      }
    });
    
    res.json(categorizedWorkflows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories', details: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
function startServer(port, host) {
  // Use passed parameters or fallback to environment/defaults
  const serverPort = port || process.env.PORT || 8000;
  const serverHost = host || '0.0.0.0';
  
  const server = app.listen(serverPort, serverHost, () => {
    console.log('🚀 N8N Workflow Documentation Server');
    console.log('=' .repeat(50));
    console.log(`🌐 Server running at http://${serverHost}:${serverPort}`);
    console.log(`📚 API Documentation: http://${serverHost}:${serverPort}/docs`);
    console.log(`📊 API Stats: http://${serverHost}:${serverPort}/api/stats`);
    console.log(`🔍 Workflow Search: http://${serverHost}:${serverPort}/api/workflows`);
    console.log();
    console.log('Press Ctrl+C to stop the server');
    console.log('-'.repeat(50));
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
      db.close();
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });
}

// CLI interface
if (require.main === module) {
  program
    .option('-p, --port <port>', 'Port to run server on', process.env.PORT || '8000')
    .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
    .option('--dev', 'Enable development mode')
    .parse();
  
  const options = program.opts();
  const port = parseInt(options.port);
  const host = options.host;
  
  // Check if database needs initialization
  db.initialize().then(() => {
    return db.getStats();
  }).then(stats => {
    if (stats.total === 0) {
      console.log('⚠️  Warning: No workflows found. Run "npm run index" to index workflows.');
    } else {
      console.log(`✅ Database ready: ${stats.total} workflows indexed`);
    }
    startServer(port, host);
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
}

module.exports = app; 