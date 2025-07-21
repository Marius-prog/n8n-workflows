#!/bin/bash
set -e

echo "🔄 Starting Netlify build..."

# Copy static files
echo "📄 Copying static files..."
if [ -d "static" ]; then
    cp -r static/* . 
    echo "✅ Static files copied"
else
    echo "❌ Static directory not found"
    exit 1
fi

# Copy API files if they exist
echo "📊 Copying API files..."
if [ -d "api-static" ]; then
    cp -r api-static .
    echo "✅ API files copied"
    echo "📊 API directory contents:"
    ls -la api-static/ | head -10
    echo "📏 API directory size:"
    du -sh api-static/
else
    echo "⚠️  api-static directory not found - this may cause issues"
fi

echo "🎉 Netlify build complete!"