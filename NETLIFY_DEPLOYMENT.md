# 🚀 Netlify Deployment Guide

Deploy your N8N Workflow Documentation system to Netlify as a static site with serverless functions.

## 📋 Prerequisites

- Netlify account
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js workflows indexed in the `workflows/` directory

## 🔧 Pre-Deployment Setup

### 1. Build Database Locally

Before deploying, you need to build the SQLite database locally:

```bash
# Install dependencies
npm install

# Initialize database and index workflows
npm run build
```

This will:
- Initialize the SQLite database (`database/workflows.db`)
- Index all workflow files from the `workflows/` directory
- Prepare static files for deployment

### 2. Verify Build

Check that the database was created successfully:

```bash
# Check database file exists
ls -la database/workflows.db

# Verify workflows were indexed (optional)
npm start
# Visit http://localhost:8000 to verify
```

## 🌐 Netlify Deployment

### Option 1: Connect Git Repository (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `static`
     - **Functions directory**: `functions`

3. **Environment Variables** (if needed)
   - Go to Site settings → Environment variables
   - Add any required variables

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Option 2: Manual Deployment

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Deploy
   netlify deploy --prod --dir=static --functions=functions
   ```

## 📁 File Structure for Deployment

```
n8n-workflows/
├── netlify.toml           # Netlify configuration
├── package.json           # Build scripts
├── functions/             # Serverless functions
│   ├── stats.js          # GET /api/stats
│   ├── workflows.js      # GET /api/workflows/*
│   ├── categories.js     # GET /api/categories
│   └── integrations.js   # GET /api/integrations
├── static/               # Frontend files (published)
│   ├── index.html        # Main interface
│   └── ...
├── database/             # SQLite database
│   └── workflows.db      # Pre-built database
├── src/                  # Node.js backend (dev only)
└── workflows/            # Workflow JSON files
```

## ⚙️ Configuration Files

### netlify.toml
```toml
[build]
  publish = "static"
  functions = "functions"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = "functions"
  node_bundler = "esbuild"
```

### package.json Build Scripts
```json
{
  "scripts": {
    "build": "npm run init && npm run index && npm run build:static",
    "build:static": "cp -r static/* . && mkdir -p database && cp database/workflows.db database/ || true",
    "netlify:build": "npm run build"
  }
}
```

## 🔍 API Endpoints (Serverless)

After deployment, your API will be available at:

- `GET /api/stats` - Workflow statistics
- `GET /api/workflows` - Search workflows
- `GET /api/workflows/:filename` - Get workflow details
- `GET /api/workflows/:filename/diagram` - Get Mermaid diagram
- `GET /api/categories` - Get workflow categories
- `GET /api/integrations` - Get available integrations

## 🚨 Important Notes

### Database Limitations
- SQLite database is read-only in Netlify (no writes possible)
- Database must be pre-built during deployment
- To update workflows, rebuild and redeploy

### Performance Considerations
- Functions have cold start latency (~100-500ms)
- Database is included in each function bundle
- Consider CDN caching for static assets

### File Size Limits
- Function size limit: 50MB (unzipped)
- Database file should be < 10MB for optimal performance
- Large workflow collections may need optimization

## 🔧 Troubleshooting

### Build Failures

1. **Database not found**
   ```bash
   # Ensure workflows directory exists
   ls workflows/

   # Run build manually
   npm run init
   npm run index
   ```

2. **Function bundle too large**
   ```bash
   # Check database size
   ls -lh database/workflows.db

   # Consider reducing workflow collection
   ```

3. **CORS Issues**
   - Check function headers in `functions/*.js`
   - Verify `netlify.toml` redirects

### Runtime Issues

1. **API not responding**
   - Check Netlify function logs
   - Verify database exists in deployment

2. **Search not working**
   - Check browser console for errors
   - Verify API endpoints are accessible

## 📊 Monitoring

### Netlify Analytics
- Function invocations and duration
- Error rates and status codes
- Build performance metrics

### Performance Optimization
- Enable Netlify Edge caching
- Use Netlify Large Media for large files
- Consider function bundling optimization

## 🔄 Updates and Maintenance

### Adding New Workflows
1. Add JSON files to `workflows/` directory
2. Run `npm run build` locally
3. Commit and push changes
4. Netlify will auto-deploy

### Database Updates
```bash
# Rebuild database
npm run init
npm run index

# Test locally
npm start

# Commit and deploy
git add database/workflows.db
git commit -m "Update workflow database"
git push origin main
```

## 🎯 Performance Tips

1. **Optimize Database**
   - Remove unused workflow files
   - Compress workflow JSON
   - Use database indexes effectively

2. **Function Optimization**
   - Minimize dependencies
   - Use efficient queries
   - Implement response caching

3. **Frontend Optimization**
   - Enable compression
   - Use CDN for static assets
   - Implement client-side caching

## 📞 Support

For deployment issues:
1. Check Netlify build logs
2. Review function execution logs
3. Test API endpoints manually
4. Verify database integrity

Your N8N Workflow Documentation is now ready for Netlify deployment! 🎉