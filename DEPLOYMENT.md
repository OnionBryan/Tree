# 🚀 Deployment Guide - Tree Logic Builder

Complete guide for deploying the Tree Logic Builder to GitHub Pages and other platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Pages Deployment](#github-pages-deployment)
  - [Automatic Deployment (Recommended)](#automatic-deployment-recommended)
  - [Manual Deployment](#manual-deployment)
  - [Troubleshooting](#troubleshooting)
- [Alternative Deployment Options](#alternative-deployment-options)
- [Configuration Details](#configuration-details)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:

- [x] Node.js 16+ installed
- [x] npm 8+ installed
- [x] Git configured
- [x] GitHub account with repository access
- [x] Project built successfully locally (`npm run build`)

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically builds and deploys on every push to the main branch.

#### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/OnionBryan/Tree`

2. Click on **Settings** (top right)

3. Scroll down to **Pages** in the left sidebar

4. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`
   - This enables the workflow to deploy automatically

   ![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/publishing-source-github-actions.webp)

#### Step 2: Push to Main Branch

```bash
# Make sure you're on the main branch
git checkout main

# Commit your changes
git add .
git commit -m "Configure GitHub Pages deployment"

# Push to GitHub
git push origin main
```

#### Step 3: Monitor Deployment

1. Go to the **Actions** tab in your repository
2. You'll see a workflow run named "Deploy to GitHub Pages"
3. Click on it to see the build progress
4. Wait for the deployment to complete (usually 2-3 minutes)

#### Step 4: Access Your Site

Once deployed, your site will be available at:

**🌐 https://onionbryan.github.io/Tree/**

The URL will also be shown in the workflow output under the "Deploy to GitHub Pages" step.

#### Workflow Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs these steps:

```yaml
1. Checkout code from repository
2. Setup Node.js 18 environment
3. Install dependencies (npm ci)
4. Build production bundle (npm run build)
5. Upload build artifacts
6. Deploy to GitHub Pages
```

**Automatic triggers:**
- Push to `main` branch
- Manual trigger from Actions tab

**Build time:** ~2-3 minutes
**Deploy time:** ~30 seconds

---

### Manual Deployment

If you prefer manual control or need to deploy from your local machine:

#### Step 1: Install gh-pages Package

```bash
npm install --save-dev gh-pages
```

This package is already included in `package.json` dev dependencies.

#### Step 2: Build and Deploy

```bash
# Build the production bundle
npm run build

# Deploy to GitHub Pages
npm run deploy
```

The `deploy` script will:
1. Build the project (`npm run build`)
2. Push the `dist` folder to the `gh-pages` branch
3. GitHub Pages will automatically serve from this branch

#### Step 3: Configure GitHub Pages (if not done)

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` / `/ (root)`
3. Click **Save**

#### Step 4: Wait for Deployment

- GitHub will deploy the site within 1-2 minutes
- Check the Pages section for the live URL

---

### Troubleshooting

#### Issue: 404 Error on GitHub Pages

**Problem:** Site shows 404 error after deployment

**Solution:**
1. Check that `base` in `vite.config.js` matches your repository name:
   ```javascript
   base: '/Tree/'  // Must match repository name
   ```

2. Ensure GitHub Pages is enabled:
   - Settings → Pages → Source should be set

3. Wait 2-3 minutes for DNS propagation

4. Clear browser cache or try incognito mode

#### Issue: Assets Not Loading

**Problem:** CSS/JS files return 404 errors

**Solution:**
1. Verify `vite.config.js` has correct base path:
   ```javascript
   base: process.env.NODE_ENV === 'production' ? '/Tree/' : '/'
   ```

2. Rebuild and redeploy:
   ```bash
   npm run build
   npm run deploy
   ```

3. Check that dist/assets files were created during build

#### Issue: GitHub Actions Workflow Fails

**Problem:** Workflow shows red X in Actions tab

**Solution:**

1. **Check Node version:**
   - Workflow uses Node 18
   - Update if needed in `.github/workflows/deploy.yml`

2. **Check build logs:**
   - Click on failed workflow
   - Expand each step to see errors
   - Common issues:
     - Missing dependencies
     - Build errors
     - Permissions issues

3. **Verify permissions:**
   - Go to Settings → Actions → General
   - Under "Workflow permissions":
     - Enable "Read and write permissions"
     - Check "Allow GitHub Actions to create and approve pull requests"

4. **Re-run workflow:**
   - Click "Re-run jobs" in Actions tab

#### Issue: Old Version Still Showing

**Problem:** Changes not reflected on live site

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Wait 2-3 minutes for CDN propagation
4. Check workflow completed successfully in Actions tab

#### Issue: Local Build Works but Deployment Fails

**Problem:** `npm run build` works locally but fails in Actions

**Solution:**
1. Check for environment differences:
   ```bash
   # Test with same Node version as workflow
   nvm use 18
   npm ci
   npm run build
   ```

2. Check for uncommitted files:
   ```bash
   git status
   git add .
   git commit -m "Add missing files"
   git push
   ```

3. Verify package-lock.json is committed:
   ```bash
   git add package-lock.json
   git commit -m "Add package-lock.json"
   ```

---

## Alternative Deployment Options

### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

**URL:** `https://tree-logic-builder.vercel.app` (or custom domain)

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

3. **Configuration (`netlify.toml`):**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

**URL:** `https://tree-logic-builder.netlify.app` (or custom domain)

### Deploy to Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure:
   - **Build command:** `npm run build`
   - **Build output:** `dist`
   - **Environment variables:** None needed
5. Click "Save and Deploy"

**URL:** `https://tree.pages.dev` (or custom domain)

---

## Configuration Details

### Vite Configuration

The `vite.config.js` file is configured for GitHub Pages:

```javascript
export default defineConfig({
  // Base path for GitHub Pages (repository name)
  base: process.env.NODE_ENV === 'production' ? '/Tree/' : '/',

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    manifest: true,

    // Code splitting for optimal loading
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'reactflow-vendor': ['reactflow'],
          'icons-vendor': ['react-icons']
        }
      }
    }
  }
})
```

**Key settings:**
- `base`: URL path prefix (must match repo name for GitHub Pages)
- `outDir`: Build output directory
- `sourcemap`: Debug maps for production
- `manualChunks`: Split code for better caching

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",                    // Development server
    "build": "vite build",            // Production build
    "preview": "vite preview",        // Preview production build
    "deploy": "npm run build && npx gh-pages -d dist",  // Deploy to GitHub Pages
    "predeploy": "npm run build"      // Auto-build before deploy
  }
}
```

### Environment Variables

For different deployment targets, you can set:

```bash
# For GitHub Pages (default)
NODE_ENV=production npm run build

# For custom domain (remove base path)
VITE_BASE_PATH=/ npm run build

# For subdirectory
VITE_BASE_PATH=/my-app/ npm run build
```

Update `vite.config.js` to use:
```javascript
base: process.env.VITE_BASE_PATH || '/Tree/'
```

---

## Post-Deployment

### Verify Deployment

1. **Check site is live:**
   ```bash
   curl -I https://onionbryan.github.io/Tree/
   ```
   Should return `200 OK`

2. **Test all features:**
   - [ ] Home page loads
   - [ ] All components render
   - [ ] Canvas interactions work
   - [ ] Dependency graph displays
   - [ ] Export functions work
   - [ ] No console errors

3. **Test on multiple browsers:**
   - [ ] Chrome/Edge
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile browsers

### Performance Optimization

After deployment, monitor and optimize:

1. **Bundle size:**
   ```bash
   npm run build
   # Check dist/assets/*.js sizes
   ```

2. **Lighthouse audit:**
   - Open DevTools → Lighthouse
   - Run audit on live site
   - Address performance issues

3. **Monitor loading:**
   - Use Chrome DevTools Network tab
   - Check for slow resources
   - Optimize as needed

### Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. **Add CNAME file:**
   ```bash
   echo "yourdomain.com" > public/CNAME
   ```

2. **Configure DNS:**
   - Add A records pointing to GitHub IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Or add CNAME record pointing to:
     ```
     onionbryan.github.io
     ```

3. **Enable in GitHub:**
   - Settings → Pages
   - Enter custom domain
   - Check "Enforce HTTPS"

4. **Wait for DNS propagation:** 24-48 hours

### Monitoring

Set up monitoring for your deployment:

1. **GitHub Actions:**
   - Watch Actions tab for failed builds
   - Set up email notifications

2. **Uptime monitoring:**
   - Use services like UptimeRobot or Pingdom
   - Monitor: https://onionbryan.github.io/Tree/

3. **Analytics (optional):**
   - Google Analytics
   - Plausible
   - Cloudflare Analytics

### Updating the Site

To update your deployed site:

**With automatic deployment:**
```bash
# Make your changes
git add .
git commit -m "Update feature X"
git push origin main
# Workflow will auto-deploy
```

**With manual deployment:**
```bash
# Make your changes
git add .
git commit -m "Update feature X"
git push origin main
npm run deploy
```

---

## Deployment Checklist

Before going live:

- [ ] All features tested locally
- [ ] Production build succeeds
- [ ] No console errors
- [ ] All links work
- [ ] Assets load correctly
- [ ] Mobile responsive
- [ ] Cross-browser tested
- [ ] GitHub Pages enabled
- [ ] Workflow configured
- [ ] README updated
- [ ] DEPLOYMENT.md reviewed

After deployment:

- [ ] Site is accessible
- [ ] All features work on live site
- [ ] Performance is acceptable
- [ ] No 404 errors
- [ ] Analytics configured (if desired)
- [ ] Team notified
- [ ] Documentation updated

---

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [GitHub Pages documentation](https://docs.github.com/en/pages)
3. Check [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html)
4. Open an issue: https://github.com/OnionBryan/Tree/issues

---

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Deployment Guide](https://reactjs.org/docs/deployment.html)
- [gh-pages Package](https://github.com/tschaub/gh-pages)

---

**Last Updated:** 2025
**Maintained by:** OnionBryan
