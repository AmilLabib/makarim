import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/portal-api': {
        target: 'https://portal.pknstan.ac.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/portal-api/, ''),
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
