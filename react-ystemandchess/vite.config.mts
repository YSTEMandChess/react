import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Replaces react-scripts (Create React App), which is unmaintained upstream and
// pinned a vulnerable build toolchain it could not be upgraded away from.
export default defineConfig({
  plugins: [
    react(),
    // `import Icon from './icon.svg?react'` -> React component.
    // A bare `import url from './icon.svg'` stays an asset URL, as before.
    svgr(),
  ],

  build: {
    // CRA emitted to build/. Keeping that name means Dockerfile's `serve -s build`
    // and any deploy scripts continue to work untouched.
    outDir: 'build',
    sourcemap: true,
  },

  server: {
    // Matches the port CRA used and the baseURL in playwright.config.ts.
    port: 3000,
    strictPort: true,
  },

  // Vite exposes env via import.meta.env, but two components and the environments
  // module read process.env directly. Defining them here keeps those files working
  // unchanged under both Vite and Jest (where import.meta would need extra Babel
  // plumbing and would break reset-password.test.tsx).
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(
      process.env.REACT_APP_API_URL ?? ''
    ),
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'development'
    ),
  },
});
