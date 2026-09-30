import { expect, test, type Page } from '@playwright/test';
import { FAILING_QUERY, mockDriveApi } from './support/mock-api.ts';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await mockDriveApi(page);
});

const matchPage = (page: Page, name: string) => expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });

test('home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('syllabus.pdf')).toBeVisible();
  await matchPage(page, 'home');
});

test('folder with more pages', async ({ page }) => {
  await page.goto('/fy');
  await expect(page.getByRole('button', { name: 'Load More' })).toBeVisible();
  await matchPage(page, 'folder-paged');
});

test('folder after loading more', async ({ page }) => {
  await page.goto('/fy');
  await page.getByRole('button', { name: 'Load More' }).click();
  await expect(page.getByText('11_ecs')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load More' })).toBeHidden();
  await matchPage(page, 'folder-loaded-more');
});

test('folder with files', async ({ page }) => {
  await page.goto('/fy/00_journals');
  await expect(page.getByText('am_journal.pdf', { exact: true })).toBeVisible();
  await matchPage(page, 'folder-files');
});

test('folder reached by clicking through', async ({ page }) => {
  await page.goto('/sy');
  await page.getByText("o'reilly & co #1").click();
  await expect(page.getByText('chapter_1.pdf')).toBeVisible();
  await matchPage(page, 'folder-special-characters');
});

test('empty folder', async ({ page }) => {
  await page.goto('/ty');
  await expect(page.getByText('Looks rather empty here')).toBeVisible();
  await matchPage(page, 'folder-empty');
});

test('unknown folder', async ({ page }) => {
  await page.goto('/not-a-real-folder');
  await expect(page.getByText('Looks rather empty here')).toBeVisible();
  await matchPage(page, 'folder-unknown');
});

test('search results', async ({ page }) => {
  await page.goto('/search?q=journal');
  await expect(page.getByText('Results for')).toBeVisible();
  await matchPage(page, 'search-results');
});

test('search without results', async ({ page }) => {
  await page.goto('/search?q=nothing-matches-this');
  await expect(page.getByText('No items found matching')).toBeVisible();
  await matchPage(page, 'search-empty');
});

test('search failure', async ({ page }) => {
  await page.goto(`/search?q=${FAILING_QUERY}`);
  await expect(page.getByText('Search failed')).toBeVisible();
  await matchPage(page, 'search-error');
});

test('not found page', async ({ page }) => {
  await page.goto('/404');
  await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible();
  await matchPage(page, 'not-found');
});

test('pdf preview', async ({ page }) => {
  await page.goto('/fy/00_journals');
  await page.getByTitle('Preview').first().click();
  await expect(page.frameLocator('iframe[title="am_journal.pdf"]').locator('body')).toBeAttached();
  await expect(page.getByText('Loading PDF…')).toBeHidden();
  await expect(page).toHaveScreenshot('preview.png');
});

test('focused search input', { tag: '@desktop-only' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('syllabus.pdf')).toBeVisible();
  await page.getByPlaceholder('Search files...').click();
  await page.keyboard.type('journal');
  await expect(page).toHaveScreenshot('search-focused.png');
});

test('mobile search opened', { tag: '@mobile-only' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('syllabus.pdf')).toBeVisible();
  await page.locator('header button:has(.tabler-icon-search):visible').click();
  await expect(page.locator('input[placeholder="Search files..."]:visible')).toBeFocused();
  await expect(page).toHaveScreenshot('mobile-search-open.png');
});

test('mobile menu opened', { tag: '@mobile-only' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('syllabus.pdf')).toBeVisible();
  await page.locator('.mantine-Burger-root').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-menu-open.png');
});
