#!/bin/bash

echo "======================================"
echo "GitHub Pages Deployment Verification"
echo "======================================"
echo ""

echo "✓ Checking main branch..."
git branch --show-current

echo ""
echo "✓ Checking dist folder..."
ls -la dist/ | grep -E "index.html|tree-visualization.js|vite.svg|.nojekyll"

echo ""
echo "✓ Checking GitHub Actions workflow..."
ls -la .github/workflows/deploy.yml

echo ""
echo "✓ Checking built index.html paths..."
cat dist/index.html | grep -E "src=|href=" | head -10

echo ""
echo "✓ Building production bundle..."
npm run build 2>&1 | grep -E "✓ built|error" | tail -3

echo ""
echo "✓ Checking package.json homepage..."
cat package.json | grep homepage

echo ""
echo "✓ Checking vite.config.js base path..."
cat vite.config.js | grep -A 2 "base:"

echo ""
echo "======================================"
echo "Deployment Checklist:"
echo "======================================"
echo "1. Main branch: $(git branch --show-current)"
echo "2. All changes committed: $(git status --short | wc -l) uncommitted files"
echo "3. Workflow exists: $(test -f .github/workflows/deploy.yml && echo 'YES' || echo 'NO')"
echo "4. Dist folder ready: $(test -d dist && echo 'YES' || echo 'NO')"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/OnionBryan/Tree/settings/pages"
echo "2. Set Source to: GitHub Actions"
echo "3. Wait for: https://github.com/OnionBryan/Tree/actions"
echo "4. Visit: https://onionbryan.github.io/Tree/"
echo ""
echo "======================================"
