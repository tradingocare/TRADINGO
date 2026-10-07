import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3012';
const API_URL = 'http://localhost:3001/api/v1';

test.describe('Phase C - E2E Verification', () => {
  const testEmail = `phasec-vendor-${Date.now()}@tradingo.test`;
  const testPassword = 'TestPass123!';

  test('Flow 1: New Vendor Registration', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    const apiCalls: Array<{url: string, status: number}> = [];
    page.on('response', resp => {
      if (resp.url().includes('/api/')) apiCalls.push({ url: resp.url(), status: resp.status() });
    });

    // Navigate to vendor registration
    await page.goto(`${BASE_URL}/register/vendor`);
    await page.waitForLoadState('networkidle');
    
    // Check current step - try to go to step 7 directly or complete steps
    const url = page.url();
    console.log('Registration URL:', url);
    
    // Try to find step indicator or form
    const stepText = await page.locator('text=Step').first().textContent().catch(() => 'unknown');
    console.log('Step indicator:', stepText);
    
    // Check if we're at step 7 or need to navigate
    // The Step7PlanSelection component should render at step 7
    // Let's check for plan selection UI
    const planCards = page.locator('button:has-text("Trade")');
    const planCount = await planCards.count();
    console.log('Plan cards found:', planCount);
    
    if (planCount > 0) {
      // We're at step 7 or can see plans
      // Select first plan (Trade Start)
      await planCards.first().click();
      await page.waitForTimeout(500);
      
      // Check all 3 legal checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const boxCount = await checkboxes.count();
      console.log('Checkboxes found:', boxCount);
      
      for (let i = 0; i < boxCount; i++) {
        const box = checkboxes.nth(i);
        if (!(await box.isChecked())) {
          await box.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Submit - find the submit button
      const submitBtn = page.locator('button:has-text("Complete Registration"), button:has-text("Submit"), button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
      
      // Check localStorage after submit
      const localStorageData = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('accessToken'),
          userRole: localStorage.getItem('userRole'),
          refreshToken: localStorage.getItem('refreshToken')
        };
      });
      console.log('localStorage after submit:', localStorageData);
      
      // Check if success state shown
      const successText = await page.locator('text=Account Created, text=Vendor Mode Activated').first().textContent().catch(() => null);
      console.log('Success state:', successText);
      
      // Navigate to seller onboarding
      await page.goto(`${BASE_URL}/seller/onboarding`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const onboardingUrl = page.url();
      console.log('After redirect to seller/onboarding:', onboardingUrl);
      
      // Check if we're on seller onboarding (not redirected to /)
      expect(onboardingUrl).not.toContain('http://localhost:3012/');
      expect(onboardingUrl).toContain('/seller/onboarding');
      
      // Refresh and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const afterRefreshUrl = page.url();
      console.log('After refresh:', afterRefreshUrl);
      expect(afterRefreshUrl).toContain('/seller/onboarding');
      
      // Check localStorage still has tokens
      const lsAfterRefresh = await page.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        userRole: localStorage.getItem('userRole')
      }));
      console.log('localStorage after refresh:', lsAfterRefresh);
      
      // Verify no console errors
      console.log('Console errors:', errors);
    } else {
      console.log('Could not reach step 7 - may need to complete earlier steps');
      // Check what step we're at
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
    }
    
    // Save results
    const results = {
      flow: 'newVendor',
      testEmail,
      passed: planCount > 0,
      localStorage: null,
      apiCalls,
      errors,
      finalUrl: page.url()
    };
    console.log('FLOW 1 RESULT:', JSON.stringify(results, null, 2));
  });

  test('Flow 4: Logout', async ({ page }) => {
    // Login first with the test account
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find and click logout
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      const apiCalls: Array<{url: string, status: number}> = [];
      page.on('response', resp => {
        if (resp.url().includes('/api/')) apiCalls.push({ url: resp.url(), status: resp.status() });
      });
      
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check for logout API call
      const logoutCall = apiCalls.find(c => c.url.includes('/auth/logout'));
      console.log('Logout API call:', logoutCall);
      
      // Check localStorage cleared
      const ls = await page.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        userRole: localStorage.getItem('userRole'),
        refreshToken: localStorage.getItem('refreshToken')
      }));
      console.log('localStorage after logout:', ls);
      
      // Try to access seller dashboard
      await page.goto(`${BASE_URL}/seller/dashboard`);
      await page.waitForLoadState('networkidle');
      const dashUrl = page.url();
      console.log('Seller dashboard after logout:', dashUrl);
      
      const results = {
        flow: 'logout',
        passed: !ls.accessToken && !ls.userRole && logoutCall?.status === 200,
        logoutCall,
        localStorage: ls,
        finalUrl: dashUrl
      };
      console.log('FLOW 4 RESULT:', JSON.stringify(results, null, 2));
    }
  });

  test('Flow 6: Seller Score / Go Live', async ({ page }) => {
    // Login with test account
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Go to seller onboarding
    await page.goto(`${BASE_URL}/seller/onboarding`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check score display
    const scoreText = await page.locator('text=/\\d+/').first().textContent().catch(() => 'unknown');
    console.log('Score display:', scoreText);
    
    // Check if Go Live button is visible
    const goLiveBtn = page.locator('button:has-text("Go Live")').first();
    const goLiveVisible = await goLiveBtn.isVisible();
    console.log('Go Live button visible:', goLiveVisible);
    
    const results = {
      flow: 'sellerScoreGoLive',
      scoreDisplay: scoreText,
      goLiveVisible,
      passed: goLiveVisible // basic check
    };
    console.log('FLOW 6 RESULT:', JSON.stringify(results, null, 2));
  });
});