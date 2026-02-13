import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 환경변수로 base path 제어 (fallback: 테섭 = /admin, 그 외 = /)
    base: env.VITE_BASE_PATH || (mode === 'test' ? '/admin' : '/'),
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
