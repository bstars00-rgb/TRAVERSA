import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project sites are served from /<repository-name>/.
// Set VITE_BASE_PATH in CI (e.g. "/traversa-ai/"); defaults to "/" for
// local dev, custom domains, and user/organization root pages.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  // 개발 서버 포트는 PORT 환경변수를 우선 사용 (프리뷰 도구의 자동 포트 할당 지원)
  server: { port: Number(process.env.PORT) || 5173 },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
