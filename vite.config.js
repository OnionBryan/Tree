import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Set base to repository name for GitHub Pages deployment
  // For local development, this will be '/'
  // For GitHub Pages, this will be '/Tree/'
  base: process.env.NODE_ENV === 'production' ? '/Tree/' : '/',

  plugins: [react()],

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure assets are properly referenced
    assetsDir: 'assets',
    // Generate manifest for better caching
    manifest: true,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'reactflow-vendor': ['reactflow'],
          'icons-vendor': ['react-icons']
        }
      }
    }
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json']
  }
})
