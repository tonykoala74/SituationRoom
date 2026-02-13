import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 注意：這裡必須改成你的 GitHub 專案名稱
  // 按照你目前的進度，應該是 /SituationRoom/
  base: '/SituationRoom/', 
})
