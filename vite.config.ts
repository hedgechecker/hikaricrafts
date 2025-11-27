import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      protocol: "wss",       // secure WebSocket
      host: "nowakl.org",    // Cloudflare domain
      port: 443,             // tunnel HTTPS port
    }
  }
});
