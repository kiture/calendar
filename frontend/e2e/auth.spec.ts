import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL } from '../global-setup';

test.describe('Authentication', () => {
  test('should allow user to register', async ({ page }) => {
    // Navigate and wait for page load
    await page.goto('/auth/register');
    await page.waitForLoadState('domcontentloaded');

    // Fill in registration form using more specific selectors
    await page.getByLabel('Email').fill(TEST_USER_EMAIL);
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');

    // Submit form and wait for response
    const response = await Promise.all([
      page.waitForResponse('**/api/users'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    // Verify response data
    const responseJson = await response[0].json();
    expect(responseJson.accessToken).not.toBeNull();
    expect(responseJson.user).not.toBeNull();
  });

  test('should allow user to login', async ({ page }) => {
    // Navigate and wait for page load
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill in login form using more specific selectors
    await page.getByLabel('Email').fill(TEST_USER_EMAIL);
    await page.locator('#password').fill('password123');

    // Submit form and wait for navigation
    const response = await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    // Verify response data
    const responseJson = await response[0].json();
    expect(responseJson.accessToken).not.toBeNull();
    expect(responseJson.user).not.toBeNull();

    // Verify redirect to home page
    await expect(async () => {
      const url = page.url();
      expect(url).toContain('/');
    }).toPass({ timeout: 5000 });
  });
});
