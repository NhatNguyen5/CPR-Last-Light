import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages deploy to /CPR-Last-Light/. Origin alone is used in Google OAuth.
export default defineConfig({
  plugins: [react()],
  base: '/CPR-Last-Light/',
})
