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
    # Copy contents of api-static to root, not the directory itself
    cp -r api-static/* .
    echo "✅ API files copied"
    echo "📊 Checking copied API files:"
    ls -la | grep -E "(workflows\.json|categories\.json)" || echo "No API files found in root"
    echo "📏 API directory size:"
    du -sh api-static/
else
    echo "⚠️  api-static directory not found - this may cause issues"
fi

echo "🎉 Netlify build complete!"