import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from 'rollup-plugin-visualizer';


export default defineConfig({
  plugins: [react(),
    
    visualizer({
      open: true, // Automatically opens the report in your browser after building
      filename: 'bundle-analysis.html',
    }),
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
    cssCodeSplit: true,
  },
});
