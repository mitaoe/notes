import { expect, test } from '@playwright/test';

import { LOAD_MORE_FAILS_NAME, STALE_TOKEN_NAME } from './fixtures/drive.ts';
import { FAILING_NAME, mockDriveApi } from './support/mock-api.ts';

test.beforeEach(async ({ page }) => {
  await mockDriveApi(page);
});

test('opening a folder from search results lands on its real path', async ({ page }) => {
  await page.goto('/search?q=00_journals');
  await page.getByRole('button', { name: '00_journals' }).click();

  await expect(page).toHaveURL('/fy/00_journals');
  await expect(page.getByText('am_journal.pdf', { exact: true })).toBeVisible();
});

test('breadcrumbs link back up the tree', async ({ page }) => {
  await page.goto('/fy/00_journals');
  await page.getByRole('link', { name: 'fy', exact: true }).click();

  await expect(page).toHaveURL('/fy');
  await expect(page.getByRole('link', { name: '00_journals' })).toBeVisible();
});

test('folders with special characters round-trip through the URL', async ({ page }) => {
  await page.goto('/sy');
  await page.getByRole('link', { name: "o'reilly & co #1" }).click();

  await expect(page).toHaveURL(`/sy/${encodeURIComponent("o'reilly & co #1")}`);
  await page.reload();
  await expect(page.getByText('chapter_1.pdf')).toBeVisible();
});

test('load more appends the next page', async ({ page }) => {
  await page.goto('/fy');
  await expect(page.getByRole('link', { name: /^\d\d_/ })).toHaveCount(10);

  await page.getByRole('button', { name: 'Load More' }).click();

  await expect(page.getByRole('link', { name: /^\d\d_/ })).toHaveCount(12);
});

test('preview steps through PDFs only', async ({ page }) => {
  await page.goto('/fy/00_journals');
  await page.getByTitle('Preview').nth(2).click();
  await expect(page.getByTitle('eee_journal.pdf')).toBeAttached();

  await page.getByRole('button', { name: 'Next file' }).click();

  await expect(page.getByTitle(/^phy_journal/)).toBeAttached();
  await expect(page.getByRole('button', { name: 'Next file' })).toBeDisabled();
});

test('download requests the redirect endpoint for the file', async ({ page }) => {
  await page.goto('/fy/00_journals');
  const request = page
    .context()
    .waitForEvent('request', (candidate) => candidate.url().includes('/api/download'));

  await page.getByTitle('Download').first().click();

  const url = new URL((await request).url());
  expect(url.pathname).toBe('/api/download');
  expect(url.searchParams.get('id')).toBe('id-_fy_00_journals_am_journal_pdf');
});

test('a preview that fails to load says so', async ({ page }) => {
  await page.goto('/fy/01_cde');
  await page.getByTitle('Preview').click();

  await expect(page.getByText('Preview not available')).toBeVisible();
  await expect(page.getByText('This file could not be loaded')).toBeVisible();
});

test('an open preview does not follow the user to another folder', async ({ page }) => {
  await page.goto('/fy');
  await page.getByRole('link', { name: '00_journals' }).click();
  await page.getByTitle('Preview').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL('/fy');
  await expect(page.getByRole('link', { name: '00_journals' })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a folder that fails to load shows an error', async ({ page }) => {
  await page.goto(`/${FAILING_NAME}`);

  await expect(
    page.getByText('An error occurred while loading this folder. Please try again.'),
  ).toBeVisible();
});

test('a failed load more shows its error beside the button', async ({ page }) => {
  await page.goto(`/sy/${LOAD_MORE_FAILS_NAME}`);
  await page.getByRole('button', { name: 'Load More' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('An error occurred while loading this folder.');
  await expect(alert).toBeInViewport();
  await expect(page.getByText('unit_0.pdf')).toBeVisible();
});

test('load more starts again from the first page when the token is rejected', async ({ page }) => {
  await page.goto(`/sy/${STALE_TOKEN_NAME}`);
  await expect(page.getByTitle('Preview')).toHaveCount(10);

  await page.getByRole('button', { name: 'Load More' }).click();

  await expect(page.getByTitle('Preview')).toHaveCount(11);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a failed next page shows a dismissible error over the preview', async ({ page }) => {
  await page.goto(`/sy/${LOAD_MORE_FAILS_NAME}`);
  await page.getByTitle('Preview').last().click();
  await page.getByRole('button', { name: 'Next file' }).click();

  const alert = page.getByRole('dialog').getByRole('alert');
  await expect(alert).toContainText("Couldn't load more files.");
  const onTop = await alert.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return element.contains(
      element.ownerDocument.elementFromPoint(left + width / 2, top + height / 2),
    );
  });
  expect(onTop).toBe(true);

  await alert.getByRole('button', { name: 'Dismiss error' }).click();
  await expect(alert).toBeHidden();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('an unknown search shows the empty state', async ({ page }) => {
  await page.goto('/search?q=nothing-matches-this');
  await expect(page.getByText('Looks rather empty here')).toBeVisible();
  await expect(page.getByText(/nothing here matches your search/)).toBeVisible();
});
