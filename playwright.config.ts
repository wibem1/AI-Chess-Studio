import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {},
    trace: 'retain-on-failure' },
  webServer: { env: { CHESS_ENABLE_PAID_API: '0', CHESS_PORT: '5173', CHESS_CREDENTIALS_PATH: join(tmpdir(),`chess-e2e-${process.pid}`,'credentials.json') }, command: 'npm start', url: 'http://127.0.0.1:5173', reuseExistingServer: false }
});
