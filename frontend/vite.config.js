import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor a host-assigned port (e.g. preview harness) when present,
    // otherwise fall back to Vite's default for local `npm run dev`.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
