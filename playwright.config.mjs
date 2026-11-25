import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4337';

export default defineConfig({
  testDir: './tests',
  use: { baseURL, channel: 'chrome', viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4337',
    url: baseURL + '/journal',
  },
});
