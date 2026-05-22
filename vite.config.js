import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy /api calls to backend during dev - no CORS issues
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // disable in production for security
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['axios', 'react-hot-toast', 'date-fns'],
        },
      },
    },
  },
  // Env vars: use VITE_ prefix instead of REACT_APP_
  envPrefix: 'VITE_',
});
