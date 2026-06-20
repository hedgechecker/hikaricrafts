import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()
  ],
  server: {
    host: "0.0.0.0",      // listen on all network interfaces
    port: 5173,
    hmr: false,            // disable HMR behind tunnel
    allowedHosts: [ "192.168.178.31", "localhost", "hikaricrafts.de"]
  },
  build: {
    chunkSizeWarningLimit: 600,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';     
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }       
            return 'vendor';
          }
        },
      },
    },
  },
});
