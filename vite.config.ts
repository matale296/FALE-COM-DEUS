import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // CRITICAL: Vercel injects variables into `process.env`.
  // Local development uses the `env` object loaded from .env file.
  // We must check both, prioritizing process.env for production builds.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This injects the value directly into the code at build time.
      // If no key is found, it injects an empty string to prevent "undefined" errors,
      // allowing the App to handle the missing key gracefully.
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
    },
  };
});