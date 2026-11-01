import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { env } from 'node:process'

const target = `http://127.0.0.1:${env.MESSENGER_API_PORT || 3000}`
const proxy = {
  '/api': { target, changeOrigin: true },
  '/socket.io': { target, changeOrigin: true, ws: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: Number(env.MESSENGER_CLIENT_PORT || 5173),
    strictPort: true,
    proxy,
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
})
