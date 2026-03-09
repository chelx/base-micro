#!/bin/bash

# Exit on any error
set -e

echo "🚀 Building all Nx services target..."
npx nx run-many --target=build --all --parallel

echo "🔧 Patching pruned package.json files with missing auth dependencies..."
for pf in dist/apps/*/package.json; do
  if [ -f "$pf" ]; then
    echo "  Patching $pf"
    # Remove existing partial patches if any (clean start)
    sed -i '' 's/"@nestjs\/passport": "[^"]*", //g' "$pf"
    sed -i '' 's/"@nestjs\/jwt": "[^"]*", //g' "$pf"
    sed -i '' 's/"passport": "[^"]*", //g' "$pf"
    sed -i '' 's/"passport-jwt": "[^"]*", //g' "$pf"
    # Inject once at the start of dependencies
    sed -i '' 's/"dependencies": {/"dependencies": { "@nestjs\/passport": "^11.0.5", "@nestjs\/jwt": "^11.0.2", "passport": "^0.7.0", "passport-jwt": "^4.0.1", "@nestjs\/config": "^4.0.3", "@nestjs\/typeorm": "^11.0.0", /' "$pf"
  fi
done

echo "🐳 Starting docker-compose for the whole platform..."
docker-compose up --build -d

echo "✅ All services are being orchestrated by Docker Compose!"
echo "You can check logs with: docker-compose logs -f"
