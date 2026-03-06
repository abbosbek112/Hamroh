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
      // Target modern browsers to reduce polyfills and bundle size
      target: 'es2020',
      // Use terser for better tree-shaking and more aggressive minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
      },
      // Enable CSS minification
      cssMinify: true,
      rollupOptions: {
        output: {
          // More granular chunk splitting for better tree-shaking and caching
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) {
                return 'react-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              if (id.includes('recharts')) {
                return 'charts-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('@sentry') || id.includes('posthog')) {
                return 'analytics-vendor';
              }
            }
          },
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'development', // Only generate sourcemaps in dev
      // Reduce reporting overhead
      reportCompressedSize: false,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});
