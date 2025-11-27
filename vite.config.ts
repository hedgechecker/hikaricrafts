import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all addresses
    port: 5173,
    hmr: {
      protocol: 'wss',   // use secure WebSocket
      host: 'nowakl.org',// must match public domain
      port: 443,         // Cloudflare Tunnel default HTTPS port
    },
    allowedHosts: ['nowakl.org', 'localhost'],
  },
})
