const WorkflowDatabase = require('./database');
const fs = require('fs-extra');
const path = require('path');

async function buildStaticAPI() {
  console.log('🔄 Building static API files...');
  
  const db = new WorkflowDatabase();
  await db.initialize();
  
  const apiDir = path.join(__dirname, '..', 'api-static');
  await fs.ensureDir(apiDir);
  
  try {
    // 1. Generate all workflows list
    console.log('📝 Generating workflows list...');
    const { workflows: allWorkflows } = await db.searchWorkflows('', 'all', 'all', false, 2100, 0);
    await fs.writeJson(path.join(apiDir, 'workflows.json'), {
      workflows: allWorkflows,
      total: allWorkflows.length,
      generated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    // 2. Generate individual workflow details
    console.log('📋 Generating individual workflow files...');
    const workflowsDir = path.join(apiDir, 'workflows');
    await fs.ensureDir(workflowsDir);
    
    let processed = 0;
    for (const workflow of allWorkflows) {
      const detail = await db.getWorkflowDetail(workflow.filename);
      if (detail) {
        // Use the workflow ID as the filename for the API
        await fs.writeJson(
          path.join(workflowsDir, `${workflow.id}.json`), 
          detail, 
          { spaces: 2 }
        );
        processed++;
        if (processed % 100 === 0) {
          console.log(`   ✅ Processed ${processed}/${allWorkflows.length} workflows`);
        }
      } else {
        console.log(`   ⚠️  No detail found for workflow: ${workflow.filename} (ID: ${workflow.id})`);
      }
    }
    
    // 3. Generate categories - create from workflow data
    console.log('📊 Generating categories...');
    const categories = {};
    allWorkflows.forEach(workflow => {
      const category = workflow.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    await fs.writeJson(path.join(apiDir, 'categories.json'), categories, { spaces: 2 });
    
    // 4. Generate stats
    console.log('📈 Generating stats...');
    const stats = await db.getStats();
    await fs.writeJson(path.join(apiDir, 'stats.json'), stats, { spaces: 2 });
    
    // 5. Generate search index for common queries
    console.log('🔍 Generating search indexes...');
    const searchDir = path.join(apiDir, 'search');
    await fs.ensureDir(searchDir);
    
    const commonSearches = [
      { q: 'telegram', filename: 'telegram.json' },
      { q: 'openai', filename: 'openai.json' },
      { q: 'webhook', filename: 'webhook.json' },
      { q: 'schedule', filename: 'schedule.json' },
      { q: '', filename: 'all.json' }
    ];
    
    for (const search of commonSearches) {
      const { workflows } = await db.searchWorkflows(search.q, 'all', 'all', false, 100, 0);
      await fs.writeJson(path.join(searchDir, search.filename), {
        workflows,
        query: search.q,
        total: workflows.length
      }, { spaces: 2 });
    }
    
    console.log('✅ Static API generation complete!');
    console.log(`📊 Generated:`);
    console.log(`   • ${allWorkflows.length} individual workflow files`);
    console.log(`   • ${commonSearches.length} search indexes`);
    console.log(`   • Categories and stats files`);
    console.log(`   • Total size: ${await getFolderSize(apiDir)} MB`);
    
  } finally {
    db.close();
  }
}

async function getFolderSize(dir) {
  const stats = await fs.stat(dir);
  if (stats.isFile()) {
    return (stats.size / 1024 / 1024).toFixed(2);
  }
  
  let size = 0;
  const items = await fs.readdir(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const itemStats = await fs.stat(itemPath);
    if (itemStats.isDirectory()) {
      size += parseFloat(await getFolderSize(itemPath));
    } else {
      size += itemStats.size;
    }
  }
  return (size / 1024 / 1024).toFixed(2);
}

if (require.main === module) {
  buildStaticAPI().catch(console.error);
}

module.exports = { buildStaticAPI };