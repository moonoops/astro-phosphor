import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('astro-phosphor-entry', 'played');
    sessionStorage.setItem('astro-phosphor-intro', 'played');
  });
});

test('desktop renders 6 shortcuts, theme switcher, Reading Mode, and camera modes without backend calls', async ({ page }) => {
  const apiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/')) apiRequests.push(req.url());
  });

  await page.goto('/');
  await expect(page.locator('.desktop-icon')).toHaveCount(6);
  await expect(page.locator('#desktop-heading')).toHaveText('Phosphor');

  // Camera zoom transitions: room -> close -> fullscreen -> close
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'room');
  await page.locator('.camera-zoom').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'close');
  await page.locator('.camera-fullscreen').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'fullscreen');
  await page.locator('.camera-fullscreen').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'close');

  // Start Menu theme cycle + Reading Mode toggle
  await page.locator('.taskbar-menu-button').click();
  await page.locator('button[data-folder-trigger="system"]').click();
  await page.getByRole('button', { name: /Phosphor theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'green');
  await page.getByRole('button', { name: 'Reading Mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reading', 'on');

  expect(apiRequests).toEqual([]);
});

test('journal filtering, bilingual MDX rendering, and work lightbox operate purely statically', async ({ page }) => {
  await page.goto('/journal');
  await expect(page.locator('[data-journal-row]')).toHaveCount(2);

  await page.locator('.journal-filter-toggle').click();
  await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  await expect(page.locator('[data-journal-row]:visible')).toHaveCount(1);

  await page.locator('[data-journal-row]:visible a').click();
  await expect(page).toHaveURL(/\/journal\/cjk-typography-on-retro-crt/);
  await expect(page.locator('article.journal-article')).toHaveAttribute('lang', 'zh-CN');

  // Navigate to Work and open first case study + lightbox
  await page.goto('/work');
  await expect(page.locator('.work-card')).toHaveCount(3);
  await page.locator('.work-card').first().click();
  await expect(page).toHaveURL(/\/work\/kulo/);
  await page.locator('[data-gallery="project-media"]').first().click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('design system has no easter eggs and offline games run with zero network calls', async ({ page }) => {
  const apiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/')) apiRequests.push(req.url());
  });

  await page.goto('/design-system');
  await expect(page.locator('.specimen-type')).not.toContainText('Aa 42');
  await expect(page.locator('body')).not.toContainText('DO NOT OPEN');

  // Games hub -> Minesweeper -> Tetris -> Magic Tower
  await page.goto('/games');
  await expect(page.locator('.games-hub-card')).toHaveCount(5);

  await page.goto('/games/minesweeper');
  await expect(page.locator('[data-game="minesweeper"]')).toBeVisible();
  await page.locator('.mine-cell').first().click();
  await expect(page.locator('[data-game="minesweeper"]')).toHaveAttribute('data-phase', /playing|won/);

  await page.goto('/games/2048');
  await expect(page.locator('[data-game="2048"]')).toBeVisible();

  await page.goto('/games/mota');
  await expect(page.locator('[data-mota-floor="0"]')).toBeVisible();

  // Power off & wake
  await page.locator('.hardware-power').click();
  await expect(page.locator('html')).toHaveAttribute('data-power', 'off');
  await page.locator('.crt-off-screen button').click();
  await expect(page.locator('html')).toHaveAttribute('data-power', 'on');

  expect(apiRequests).toEqual([]);
});

test('mobile phone viewport keeps 3x2 icons and zero horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.desktop-icon')).toHaveCount(6);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
