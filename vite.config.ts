import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/gemini/generate-content': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(
              '/api/gemini/generate-content',
              `/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''}`
            )
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
