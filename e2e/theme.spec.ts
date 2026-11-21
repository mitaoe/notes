import { expect, test } from '@playwright/test';

import { mockDriveApi } from './support/mock-api.ts';

test.beforeEach(async ({ page }) => {
  await mockDriveApi(page);
});

test('buttons, icon buttons and links show the pointer cursor', async ({ page }) => {
  await page.goto('/fy');
  await expect(page.getByRole('button', { name: 'Load More' })).toHaveCSS('cursor', 'pointer');

  await page.goto('/fy/00_journals');
  await expect(page.getByRole('link', { name: 'fy', exact: true })).toHaveCSS('cursor', 'pointer');
  await expect(page.getByTitle('Download').first()).toHaveCSS('cursor', 'pointer');
});

test('the search icon shows the pointer cursor', { tag: '@desktop-only' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toHaveCSS(
    'cursor',
    'pointer',
  );
});
