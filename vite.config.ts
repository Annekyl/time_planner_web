import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Time Planner',
        short_name: 'Planner',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
  base: '/time_planner_web/',
})
