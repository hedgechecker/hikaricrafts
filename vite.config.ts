import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or whatever framework you use

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,      // <-- Disable hot module replacement
    host: "0.0.0.0", // so it’s accessible through the tunnel
    port: 5173
  }
});
