const { WorkflowDatabase } = require('../src/database');

exports.handler = async (event, context) => {
  try {
    const db = new WorkflowDatabase();
    await db.initialize();
    
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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(categorizedWorkflows)
    };
  } catch (error) {
    console.error('Error in categories function:', error);
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