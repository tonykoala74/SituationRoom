import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 這裡開啟離線支援 (SRS 3.2)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // 快取 Google Sheets 的 CSV 請求
            urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/i,
            handler: 'NetworkFirst', // 優先走網路抓最新資料，斷網時自動回傳快取
            options: {
              cacheName: 'google-sheets-data',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 資料保留 24 小時
              }
            }
          }
        ]
      },
      manifest: {
        name: '救災戰情看板',
        short_name: '戰情看板',
        description: '提供消防救災即時資訊與戰情分析',
        theme_color: '#d32f2f', // 消防紅
        background_color: '#fafafa',
        display: 'standalone', // 像 App 一樣獨立開啟，不顯示瀏覽器網址列
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/SituationRoom/', 
})
