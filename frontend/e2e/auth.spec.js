import { test, expect } from '@playwright/test';

test('unauthenticated visitor is redirected from a protected page to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('login through the UI lands the tenant on the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('tenant@demo.com');
  await page.getByLabel('Password').fill('Demo1234!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByRole('link', { name: 'Rentora' })).toBeVisible();
});

test('wrong credentials keep the user on the login page with an error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('tenant@demo.com');
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('logout clears the session and returns to the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('landlord@demo.com');
  await page.getByLabel('Password').fill('Demo1234!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator('button.btn-light[data-bs-toggle="dropdown"]').click();
  await page.getByRole('button', { name: 'Logout' }).click();

  await expect(page).toHaveURL(/\/login$/);
});
