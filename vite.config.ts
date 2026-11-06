import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Amplify sets AMPLIFY_BACKEND_URL and AMPLIFY_BACKEND_PUBLISHABLE_KEY for every
  // build of an app with a backend. For local dev they can come from .env.local.
  // Both are safe in browser code: the key only grants anon / the signed-in user.
  const env = { ...loadEnv(mode, process.cwd(), 'AMPLIFY_'), ...process.env }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.AMPLIFY_BACKEND_URL': JSON.stringify(env.AMPLIFY_BACKEND_URL ?? ''),
      'import.meta.env.AMPLIFY_BACKEND_PUBLISHABLE_KEY': JSON.stringify(
        env.AMPLIFY_BACKEND_PUBLISHABLE_KEY ?? '',
      ),
    },
    server: { port: 5173, strictPort: true },
  }
})
