import { defineConfig, devices } from '@playwright/test';

// For looking at the 3D scenes. The normal suite runs with 3D off. This one talks to a second dev server (port 3100)
// started with NEXT_PUBLIC_3D=1 and its own build folder, and starts Chromium with software WebGL so it works without a GPU.
//   $env:NEXT_DIST_DIR='.next-3d'; $env:NEXT_PUBLIC_3D='1'; npx next dev -p 3100
//   SHOTS=<folder> npx playwright test --config playwright.3d.config.ts
export default defineConfig({
  testDir: './tests/3d',
  timeout: 240_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] },
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
