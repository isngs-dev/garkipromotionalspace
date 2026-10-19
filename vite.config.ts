import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './', // relative asset paths so dist/ can be hosted from any folder
  plugins: [react(), tailwindcss()],
  server: { port: 5190, host: '127.0.0.1' },
});
