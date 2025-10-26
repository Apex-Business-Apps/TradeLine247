// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        buffer: 'buffer/',      // for Buffer polyfill when libs expect Node
      },
    },
    define: {
      global: 'globalThis',
      'process.env': {},       // keep Node-style env refs from crashing in browser
    },
    optimizeDeps: {
      include: ['buffer'],
    },
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        // keep hot-reload predictable; add your previous custom headers here if you had any
        'Cache-Control': 'no-store',
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    build: {
      target: 'es2020',        // preserves modern syntax but safe on Node 18+ hosts
      sourcemap: !isProd,
      outDir: 'dist',
    },
  };
});
