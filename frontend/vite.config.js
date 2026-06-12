import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://pavestone-hexagram-emphasize.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',  // ✅ bypass ngrok warning page
        },
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})