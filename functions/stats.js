const { WorkflowDatabase } = require('../src/database');

exports.handler = async (event, context) => {
  try {
    const db = new WorkflowDatabase();
    await db.initialize();
    
    const stats = await db.getStats();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(stats)
    };
  } catch (error) {
    console.error('Error in stats function:', error);
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