import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('Starting E2E test suite...');
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
}

export default globalSetup;
