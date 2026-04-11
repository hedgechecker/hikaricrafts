import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or your framework

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",      // listen on all network interfaces
    port: 5173,
    hmr: false,            // optional: disable HMR behind tunnel
    allowedHosts: ["nowakl.org", "192.168.178.31", "localhost", "hikaricrafts.de" , "hikaricrafts.xyz"]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // optional, reduces warnings for large JS
  },
});
