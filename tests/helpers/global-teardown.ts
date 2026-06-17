import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('E2E test suite complete.');
}

export default globalTeardown;
