import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // PWA Configuration
  server: {
    host: '0.0.0.0', // Allow external connections for testing
    port: 3000
  },
  
  build: {
    // Generate service worker in build
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },
  
  // Copy files to dist
  publicDir: 'public'
})