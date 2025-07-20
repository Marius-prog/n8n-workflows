const { WorkflowDatabase } = require('../src/database');
const url = require('url');

exports.handler = async (event, context) => {
  try {
    // Security headers for all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Access-Control-Allow-Origin': '*'
    };

    const db = new WorkflowDatabase();
    
    // Debug logging for production issues
    if (process.env.NETLIFY && event.queryStringParameters?.debug === 'true') {
      console.log('Debug info:', {
        dbPath: db.dbPath,
        workflowsDir: db.workflowsDir,
        __dirname,
        cwd: process.cwd(),
        env: Object.keys(process.env).filter(k => k.startsWith('NETLIFY'))
      });
    }
    
    await db.initialize();
    
    const { httpMethod, queryStringParameters, path } = event;
    
    // Input validation for path
    if (!path || typeof path !== 'string') {
      return {
        statusCode: 400,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid path parameter' })
      };
    }
    
    // Handle CORS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          ...securityHeaders,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        },
        body: ''
      };
    }
    
    // Only allow GET requests
    if (httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Parse the path to determine the endpoint
    const pathParts = path.replace('/api/workflows', '').split('/').filter(p => p);
    
    if (pathParts.length === 0) {
      // Search workflows: GET /api/workflows
      const {
        q = '',
        trigger = 'all',
        complexity = 'all',
        active_only = false,
        page = 1,
        per_page = 20
      } = queryStringParameters || {};
      
      const pageNum = Math.max(1, parseInt(page));
      const perPage = Math.min(100, Math.max(1, parseInt(per_page)));
      const offset = (pageNum - 1) * perPage;
      const activeOnly = active_only === 'true';
      
      const { workflows, total } = await db.searchWorkflows(
        q, trigger, complexity, activeOnly, perPage, offset
      );
      
      const pages = Math.ceil(total / perPage);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
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
        })
      };
    } else if (pathParts.length === 1) {
      // Get workflow detail: GET /api/workflows/:filename
      const filename = pathParts[0];
      const workflow = await db.getWorkflowDetail(filename);
      
      if (!workflow) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Workflow not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(workflow)
      };
    } else if (pathParts.length === 2 && pathParts[1] === 'diagram') {
      // Get workflow diagram: GET /api/workflows/:filename/diagram
      const filename = pathParts[0];
      const workflow = await db.getWorkflowDetail(filename);
      
      if (!workflow || !workflow.raw_workflow) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Workflow not found' })
        };
      }
      
      const diagram = generateMermaidDiagram(workflow.raw_workflow.nodes, workflow.raw_workflow.connections);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ diagram })
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Not found' })
      };
    }
  } catch (error) {
    console.error('Error in workflows function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

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