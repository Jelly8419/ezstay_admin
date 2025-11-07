import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 환경변수로 base path 제어 (fallback: 개발 = /, 그 외 = /admin/)
    base: env.VITE_BASE_PATH || (mode === 'development' ? '/' : '/admin/'),
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
    },
  };
});
