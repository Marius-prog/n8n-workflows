# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This repository contains 2,055 n8n workflow automation files with a comprehensive documentation and search system. It includes both Python/FastAPI and Node.js/Express implementations for workflow browsing and analysis, plus SQLite database integration for fast searching.

## Repository Architecture

### Core Components
- `/workflows/` - 2,055 n8n workflow JSON files (34MB) organized by ID and service integration
- `/database/` - SQLite database with FTS5 full-text search indexing
- `/src/` - Node.js implementation with Express server and database operations
- `/static/` - Frontend HTML interfaces with responsive design and dark/light themes
- `/context/` - Service categorization definitions and automated category mapping
- `/venv/` - Python virtual environment for FastAPI implementation

### Dual Implementation Stack
**Python (Primary)**: FastAPI + Uvicorn + SQLite + Pydantic
**Node.js (Alternative)**: Express + SQLite3 + Helmet security + compression

## Common Development Commands

### Python Implementation
```bash
python run.py                    # Start FastAPI server (primary)
python import_workflows.py       # Import workflows to n8n instance
pip install -r requirements.txt  # Install Python dependencies
```

### Node.js Implementation
```bash
npm start                        # Start Express server
npm run dev                      # Development mode with auto-reload
npm run init                     # Initialize SQLite database
npm run index                    # Index all workflows for search
npm install                      # Install Node dependencies
```

### Docker Deployment
```bash
docker-compose up                # Start containerized application
docker-compose up --build       # Rebuild and start containers
```

## Workflow Organization

### Naming Convention
Workflows follow the pattern: `[ID]_[Service1]_[Service2]_[Purpose]_[Trigger].json`

Examples:
- `0001_Telegram_Schedule_Automation_Scheduled.json`
- `2054_Deep_Research_Report_Generation_With_Open_Router_Google_Search_Webhook_Telegram_and_Notion.json`

### Service Categories (15 total)
- AI Agent Development
- Business Process Automation  
- Communication & Messaging
- Data Processing & Analysis
- Technical Infrastructure & DevOps
- [View context/def_categories.json for complete mapping]

### Workflow Statistics
- **2,055 total workflows** with 29,445 nodes (avg 14.3 nodes/workflow)
- **365 unique integrations** across major platforms
- **215 active workflows** (10.5% active rate)
- **Trigger distribution**: 40.5% Complex, 25.3% Webhook, 23.2% Manual, 11.0% Scheduled

## Key Architecture Patterns

### Database Schema
```sql
workflows table: id, name, description, category, tags, nodes_count, active, created_at, updated_at, file_path
workflow_nodes table: workflow_id, node_id, node_type, node_name, position
```

### Search Implementation
- SQLite FTS5 full-text search for sub-100ms queries
- Category filtering with service-to-category mapping
- Real-time statistics and analytics
- Mermaid diagram generation for workflow visualization

### API Endpoints Structure
```
GET /api/workflows              # List all workflows with filtering
GET /api/workflows/{id}         # Get specific workflow details  
GET /api/categories            # Get all categories with counts
GET /api/search               # Full-text search workflows
GET /api/stats               # Repository statistics
POST /api/regenerate         # Regenerate search categories
```

## Development Guidelines

### Working with Workflow Files
- Workflows contain sensitive placeholder data - credentials must be updated before use
- Each JSON has standard n8n structure: name, nodes[], connections{}, settings{}, staticData{}
- Node analysis requires parsing both node types and connection flows
- Preserve node ID uniqueness when modifying workflows

### Performance Considerations
- Database indexing provides 100x performance improvement over file scanning
- Frontend loads sub-second with efficient SQLite queries
- Mobile-responsive design supports various screen sizes
- Compression middleware reduces payload sizes

### Security Notes
- All credentials in workflows are placeholders for educational purposes
- Rate limiting and CORS protection implemented
- Helmet security headers applied to Express routes
- Environment variables used for sensitive configuration

## Integration Testing
No automated test suite present. Manual testing involves:
1. Starting development servers
2. Verifying database initialization
3. Testing search functionality
4. Validating API endpoints
5. Checking workflow import processes

## Popular Integrations
Top services by workflow count: Telegram, OpenAI, Google Drive, HTTP Request, Webhook, Discord, PostgreSQL, Airtable, Google Sheets, WhatsApp

## Memorized Tasks
- to memorize