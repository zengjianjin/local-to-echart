import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Electron loads dist/index.html over file://; absolute asset paths would
  // resolve to the drive root (file:///D:/assets/...). Relative paths keep
  // assets inside app.asar.
  base: './',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
})
