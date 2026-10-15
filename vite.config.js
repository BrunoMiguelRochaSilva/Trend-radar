import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// TrendRadar frontend build config.
// The dev server proxies /api/* to our Express backend so the browser only
// ever talks to our own server — it never sees the Kalodata API or its key.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT || 3001;
  const dataMode = String(env.USE_MOCK_DATA).toLowerCase() === 'true' ? 'mock' : 'live';

  return {
    plugins: [react()],
    define: {
      // Lets the browser query cache keep mock and live results apart (src/services/queryCache.js).
      __DATA_MODE__: JSON.stringify(dataMode),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
