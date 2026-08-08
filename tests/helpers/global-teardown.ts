import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import { authCacheFile } from './global-setup';

async function globalTeardown(_config: FullConfig) {
  const cacheFile = authCacheFile();
  try {
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  } catch (err) {
    console.log(`global-teardown: failed to remove auth cache: ${(err as Error).message}`);
  }
  console.log('E2E test suite complete.');
}

export default globalTeardown;
