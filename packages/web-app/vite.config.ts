import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '7891', 10),
  },
  build: {
    outDir: 'dist',
  },
});
