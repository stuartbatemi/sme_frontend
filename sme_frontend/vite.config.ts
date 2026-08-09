import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      allowedHosts: true,
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true },
      },
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:5000'),
      __FASTAPI_URL__: JSON.stringify(env.VITE_FASTAPI_URL || 'http://localhost:8000'),
    },
  }
})
