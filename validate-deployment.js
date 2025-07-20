#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Netlify Deployment Setup...\n');

let issues = 0;

// Check required files
const requiredFiles = [
  'netlify.toml',
  'package.json',
  'static/index.html',
  'database/workflows.db',
  'functions/stats.js',
  'functions/workflows.js',
  'functions/categories.js',
  'functions/integrations.js'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    issues++;
  }
});

// Check database size
const dbPath = 'database/workflows.db';
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  const sizeMB = stats.size / (1024 * 1024);
  console.log(`\n📊 Database size: ${sizeMB.toFixed(2)} MB`);
  
  if (sizeMB > 50) {
    console.log('  ⚠️  Database is quite large (>50MB) - may affect function performance');
  } else if (sizeMB > 10) {
    console.log('  ⚠️  Database is moderately large (>10MB) - monitor function performance');
  } else {
    console.log('  ✅ Database size is optimal');
  }
}

// Check workflows directory
const workflowsDir = 'workflows';
if (fs.existsSync(workflowsDir)) {
  const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
  console.log(`\n📋 Workflows: ${files.length} JSON files found`);
  if (files.length === 0) {
    console.log('  ⚠️  No workflow files found - database may be empty');
  }
}

// Check netlify.toml configuration
console.log('\n⚙️  Netlify configuration:');
try {
  const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
  if (netlifyConfig.includes('publish = "static"')) {
    console.log('  ✅ Publish directory configured');
  } else {
    console.log('  ❌ Publish directory not configured');
    issues++;
  }
  
  if (netlifyConfig.includes('functions = "functions"')) {
    console.log('  ✅ Functions directory configured');
  } else {
    console.log('  ❌ Functions directory not configured');
    issues++;
  }
  
  if (netlifyConfig.includes('/api/*')) {
    console.log('  ✅ API redirects configured');
  } else {
    console.log('  ❌ API redirects not configured');
    issues++;
  }
} catch (error) {
  console.log('  ❌ Cannot read netlify.toml');
  issues++;
}

// Check package.json build script
console.log('\n🔨 Build configuration:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('  ✅ Build script configured');
  } else {
    console.log('  ❌ Build script missing');
    issues++;
  }
} catch (error) {
  console.log('  ❌ Cannot read package.json');
  issues++;
}

// Summary
console.log('\n' + '='.repeat(50));
if (issues === 0) {
  console.log('🎉 All checks passed! Ready for Netlify deployment');
  console.log('\nNext steps:');
  console.log('1. Commit all changes to git');
  console.log('2. Push to your repository');
  console.log('3. Connect repository to Netlify');
  console.log('4. Deploy with build command: npm run build');
} else {
  console.log(`❌ Found ${issues} issue(s) that need to be resolved`);
  process.exit(1);
}