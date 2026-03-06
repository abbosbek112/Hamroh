import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
    ],
    // Email verification: use .env VITE_SKIP_EMAIL_VERIFICATION=true (Auth/api read it)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Performance optimizations
      minify: 'esbuild', // esbuild is faster and included by default
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react', 'recharts'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'development', // Only generate sourcemaps in dev
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});
