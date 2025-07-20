# Production Deployment Guide

## Security Configuration ✅

### Headers
- **CSP**: Content Security Policy implemented
- **HSTS**: HTTP Strict Transport Security enabled
- **X-Frame-Options**: DENY to prevent clickjacking
- **X-Content-Type-Options**: nosniff to prevent MIME type sniffing
- **Permissions Policy**: Restricted access to sensitive APIs

### API Security
- **Method Restriction**: Only GET and OPTIONS allowed
- **Input Validation**: Path and query parameter validation
- **Rate Limiting**: Implemented via Netlify configuration
- **CORS**: Properly configured with access control

### Secrets Management
- **No Hard-coded Secrets**: All API keys in workflows are placeholders
- **Secrets Scanning**: Disabled for educational placeholder values
- **Environment Variables**: Secure configuration management

## Database & Performance

### Database Configuration
- **SQLite with FTS5**: Full-text search enabled
- **WAL Mode**: Write-Ahead Logging for better performance
- **Proper Indexing**: Optimized queries for fast responses
- **Auto-sync**: FTS table automatically maintained

### Caching Strategy
- **API Responses**: 5-10 minutes cache for static data
- **Static Assets**: Long-term caching
- **No-cache**: Health checks and dynamic queries

## Monitoring & Health

### Health Check Endpoint
Access `/api/health` to verify:
- Database connectivity
- File system access
- Workflow count validation
- Critical file availability

### Debug Mode
Add `?debug=true` to API endpoints in production for diagnostic info.

### Key Metrics to Monitor
- API response times
- Database query performance
- Error rates
- Workflow count consistency

## Deployment Checklist

### Pre-deployment
- ✅ Remove any real API keys from workflows
- ✅ Verify database contains all workflows
- ✅ Test all API endpoints locally
- ✅ Run security headers validation

### Post-deployment
- ✅ Check `/api/health` endpoint
- ✅ Verify workflow count matches expected (2,055)
- ✅ Test search functionality
- ✅ Validate all security headers

### Troubleshooting

**No workflows loading:**
1. Check `/api/health` for database status
2. Verify workflows directory copied correctly
3. Check database path configuration
4. Review build logs for indexing errors

**Performance issues:**
1. Monitor database query times
2. Check cache headers implementation
3. Verify FTS5 index integrity
4. Review API response sizes

**Security concerns:**
1. Validate CSP headers working
2. Test CORS configuration
3. Verify rate limiting active
4. Check for any exposed sensitive data

## Production URLs

- **Main Site**: `https://your-site.netlify.app`
- **API Base**: `https://your-site.netlify.app/api`
- **Health Check**: `https://your-site.netlify.app/api/health`
- **Workflows API**: `https://your-site.netlify.app/api/workflows`

## Environment Variables

Required in Netlify:
```
NODE_VERSION=18
NETLIFY=true
SECRETS_SCAN_SMART_DETECTION_ENABLED=false
```

## File Structure in Production

```
/
├── index.html              # Main frontend
├── database/
│   └── workflows.db        # SQLite database
├── workflows/              # Original workflow files
└── .netlify/
    └── functions/          # Serverless functions
        ├── workflows.js
        ├── categories.js
        ├── stats.js
        ├── integrations.js
        └── health.js
```