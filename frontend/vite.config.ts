import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.VANTAGEM_API_TARGET ?? 'http://localhost:4200';

const paraApi = { target: apiTarget, changeOrigin: true };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': paraApi,
      '/health': paraApi,
      '/ready': paraApi,
    },
  },
});
