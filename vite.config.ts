import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  // 正: ここ（トップレベル）に書きます
  // 値は必ずスラッシュで囲んでください
  plugins: [react(), mkcert()],
  base: '/my-profile-app/',

  // 開発サーバー用の設定（デプロイには影響しません）
  server: {
    open: false,
    port: 3000,
    allowedHosts: true,
  },
  
  // ビルド（公開用ファイル生成）用の設定
  build: {
    outDir: 'build'
  },

})