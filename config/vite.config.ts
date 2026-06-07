import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",      // listen on all network interfaces
    port: 5173,
    hmr: false,            // disable HMR behind tunnel
    allowedHosts: [ "192.168.178.31", "localhost", "hikaricrafts.de"]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, //reduces warnings for large JS
  },
});
