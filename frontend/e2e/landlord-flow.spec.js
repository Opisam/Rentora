import { test, expect } from '@playwright/test';
import { gotoAs } from './helpers';

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test('landlord approves a pending application and creates the lease end-to-end', async ({
  page,
  request,
}) => {
  await gotoAs(page, request, 'landlord@demo.com', 'Demo1234!', '/applications');

  // Fresh seed guarantees Maria has exactly one pending application, on unit 2A
  const pending = page
    .locator('.card', { hasText: 'Maria Lopez' })
    .filter({ hasText: 'Unit #2A' });
  await expect(pending).toHaveCount(1);
  await pending.getByRole('button', { name: 'Approve' }).click();

  // After approval the lease form appears on the same card
  const approved = page
    .locator('.card', { hasText: 'Maria Lopez' })
    .filter({ hasText: 'Unit #2A' });
  await expect(approved).toContainText('approved');
  await expect(approved).toContainText('Create a lease to finalize');

  const form = approved.locator('form');
  await form.locator('input[type="date"]').nth(0).fill(isoInDays(7));
  await form.locator('input[type="date"]').nth(1).fill(isoInDays(367));
  await form.getByPlaceholder('1200').fill('1600');
  await form.getByRole('button', { name: 'Create Lease' }).click();

  await expect(approved).toContainText('Lease created');
});
