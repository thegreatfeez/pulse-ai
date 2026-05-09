import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'automatic' }),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'process'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    cors: true,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          return 'vendor';
        },
      },
    },
  },
})
