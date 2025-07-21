# Heroku Deployment Guide

This guide explains how to deploy the N8N Workflows Documentation System to Heroku.

## Prerequisites

- Heroku CLI installed
- Git repository
- Heroku account

## Quick Deploy

### Option 1: Heroku Button (Recommended)

Click the button below to deploy directly to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/your-username/n8n-workflows)

### Option 2: Manual Deployment

1. **Create a new Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_PATH=database/workflows.db
   ```

3. **Deploy the application**:
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

4. **Open your application**:
   ```bash
   heroku open
   ```

## Configuration

The app uses the following environment variables:

- `NODE_ENV`: Set to "production" for Heroku
- `PORT`: Automatically set by Heroku
- `DATABASE_PATH`: SQLite database path (default: "database/workflows.db")

## Build Process

The deployment automatically:

1. Installs Node.js dependencies
2. Initializes SQLite database
3. Indexes all 2,055+ n8n workflows
4. Starts the Express server

## Post-Deployment

After successful deployment:

- Visit your app URL to see the workflow browser
- API is available at `/api/workflows`
- Database contains indexed workflows with full-text search

## Troubleshooting

### Common Issues

1. **Build timeout**: The initial indexing of 2,055 workflows may take time. If build times out, the app will still work and index on first request.

2. **Memory issues**: Consider upgrading to a higher dyno type if you encounter memory issues during indexing.

3. **Static files not found**: Ensure the `static/` directory exists and contains `index.html`.

### Logs

Check application logs:
```bash
heroku logs --tail
```

## Architecture

The Heroku deployment uses:

- **Runtime**: Node.js with Express server
- **Database**: SQLite (rebuilt on each deploy)
- **Static Files**: Served directly by Express
- **Process**: Single web dyno

## Performance

- Initial deployment: ~2-3 minutes (includes workflow indexing)
- Response time: Sub-100ms for most API calls
- Memory usage: ~200MB after full indexing
- Storage: ~50MB for database + workflows

## Updates

To update the deployment:

```bash
git add .
git commit -m "Update workflows"
git push heroku main
```

The database will be rebuilt automatically with any new workflows.