const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Security headers for all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=600'
    };

    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
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
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { path: requestPath, queryStringParameters } = event;
    
    // Parse the path to determine what to serve
    const pathParts = requestPath.replace('/api/workflows', '').split('/').filter(p => p);
    
    let filePath;
    
    if (pathParts.length === 0) {
      // Main workflows list - check for search query
      const q = queryStringParameters?.q;
      if (q) {
        // Try to find pre-built search results
        const searchFile = path.join(__dirname, '..', 'api-static', 'search', `${q.toLowerCase()}.json`);
        if (fs.existsSync(searchFile)) {
          filePath = searchFile;
        } else {
          // Fall back to all workflows and filter client-side
          filePath = path.join(__dirname, '..', 'api-static', 'workflows.json');
        }
      } else {
        filePath = path.join(__dirname, '..', 'api-static', 'workflows.json');
      }
    } else if (pathParts.length === 1) {
      // Individual workflow
      const workflowId = pathParts[0].replace('.json', '');
      filePath = path.join(__dirname, '..', 'api-static', 'workflows', `${workflowId}.json`);
    } else {
      return {
        statusCode: 404,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' })
      };
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Resource not found' })
      };
    }

    // Read and return the static JSON file
    const data = fs.readFileSync(filePath, 'utf8');
    
    return {
      statusCode: 200,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json'
      },
      body: data
    };

  } catch (error) {
    console.error('Error in workflows-static function:', error);
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