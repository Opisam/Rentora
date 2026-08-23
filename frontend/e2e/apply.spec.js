import { test, expect } from '@playwright/test';
import { gotoAs } from './helpers';

test('tenant browses vacant units and submits an application with a message', async ({
  page,
  request,
}) => {
  await gotoAs(page, request, 'tenant@demo.com', 'Demo1234!', '/browse');

  const firstCard = page.locator('.card', { hasText: 'Apply for this unit' }).first();
  await firstCard
    .getByPlaceholder(/^Message to /)
    .fill('Hello! I am very interested in this unit and can move in immediately.');

  await firstCard.getByRole('button', { name: 'Apply for this unit' }).click();

  await expect(page.getByText(/Application submitted!/)).toBeVisible();
});
