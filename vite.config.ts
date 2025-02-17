import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    open: false,
    port: 3000,
    allowedHosts: true // TODO put specific names for prod
  },
  build: {
    outDir: 'build'
  },
//   base: '/',
  plugins: [react(), mkcert()],
//   test: {
//     globals: true,
//     environment: 'jsdom',
//     setupFiles: './src/setupTests.ts',
//     css: true,
//     reporters: ['verbose'],
//     coverage: {
//         reporter: ['text', 'json', 'html'],
//         include: ['src/**/*'],
//         exclude: [],
//     }
//   },
})
