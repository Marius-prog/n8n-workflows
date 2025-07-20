const { WorkflowDatabase } = require('../src/database');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NETLIFY ? 'netlify' : 'local',
      checks: {}
    };

    // Check database file exists
    const db = new WorkflowDatabase();
    const dbExists = fs.existsSync(db.dbPath);
    health.checks.database_file = dbExists ? 'pass' : 'fail';
    health.checks.database_path = db.dbPath;

    // Check workflows directory
    const workflowsExists = fs.existsSync(db.workflowsDir);
    health.checks.workflows_directory = workflowsExists ? 'pass' : 'fail';
    health.checks.workflows_path = db.workflowsDir;

    if (dbExists && workflowsExists) {
      // Try to initialize database and get stats
      await db.initialize();
      const stats = await db.getStats();
      health.checks.database_connection = 'pass';
      health.checks.workflow_count = stats.total;
      health.checks.active_workflows = stats.active;
      db.close();
    } else {
      health.checks.database_connection = 'fail';
      health.status = 'unhealthy';
    }

    // Check for critical files
    const criticalPaths = [
      'index.html',
      'database/workflows.db'
    ];

    health.checks.critical_files = {};
    for (const filePath of criticalPaths) {
      const exists = fs.existsSync(path.join(__dirname, '..', filePath));
      health.checks.critical_files[filePath] = exists ? 'pass' : 'fail';
      if (!exists) health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return {
      statusCode,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(health, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, null, 2)
    };
  }
};