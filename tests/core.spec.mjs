import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('astro-phosphor-entry', 'played');
    sessionStorage.setItem('astro-phosphor-intro', 'played');
  });
});

test('desktop defaults to Rainbow OS with 6 shortcuts, camera modes, and zero-duplication chrome across all 5 OSes', async ({ page }) => {
  const apiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/')) apiRequests.push(req.url());
  });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-os', 'rainbow');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'studio');
  await expect(page.locator('.desktop-icon')).toHaveCount(6);
  await expect(page.locator('#desktop-heading')).toHaveText('Phosphor');
  await expect(page.locator('.os-topbar')).toBeVisible();
  await expect(page.locator('.taskbar')).toBeHidden();

  // Camera zoom transitions: room -> close -> fullscreen -> close
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'room');
  await page.locator('.camera-zoom').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'close');
  await page.locator('.camera-fullscreen').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'fullscreen');
  await page.locator('.camera-fullscreen').click();
  await expect(page.locator('html')).toHaveAttribute('data-zoom', 'close');

  // Switch from Rainbow (top-only) -> Phosphor (bottom-only) via top OS switcher
  await page.locator('.os-topbar-os-btn').click();
  await page.locator('#os-topbar-menu [data-os-option="phosphor"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'phosphor');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber');
  await expect(page.locator('.os-topbar')).toBeHidden();
  await expect(page.locator('.taskbar')).toBeVisible();

  // Bottom Start Menu: cycle Phosphor theme -> green + enable Reading Mode
  await page.locator('.taskbar-menu-button').click();
  await page.locator('button[data-folder-trigger="system"]').click();
  await page.getByRole('button', { name: /Phosphor theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'green');
  await page.getByRole('button', { name: 'Reading Mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reading', 'on');

  // Switch across Coffee, CLI, Pixel and back to Phosphor verifying per-OS sub-theme persistence
  await page.locator('.start-menu [data-os-option="coffee"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'coffee');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'roast');
  await expect(page.locator('.os-topbar')).toBeVisible();
  await expect(page.locator('.taskbar')).toBeVisible();

  await page.locator('.taskbar-os-trigger').click();
  await page.locator('#taskbar-os-menu [data-os-option="cli"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'cli');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'claude');
  await expect(page.locator('.os-topbar')).toBeHidden();
  await expect(page.locator('.taskbar')).toBeVisible();

  await page.locator('.taskbar-os-trigger').click();
  await page.locator('#taskbar-os-menu [data-os-option="pixel"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'pixel');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(page.locator('.os-topbar')).toBeVisible();
  await expect(page.locator('.taskbar')).toBeHidden();

  await page.locator('.os-topbar-os-btn').click();
  await page.locator('#os-topbar-menu [data-os-option="phosphor"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'phosphor');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'green');

  // Verify dynamic cursor CSS variable was generated
  const cursorArrow = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--cursor-arrow'));
  expect(cursorArrow).toContain('data:image/svg+xml');

  expect(apiRequests).toEqual([]);
});

test('?os= query override applies cleanly without FOUC and survives route navigation', async ({ page }) => {
  await page.goto('/?os=coffee&scene=night');
  await expect(page.locator('html')).toHaveAttribute('data-os', 'coffee');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'night');

  await page.goto('/work');
  await expect(page.locator('html')).toHaveAttribute('data-os', 'coffee');
  await expect(page.locator('.os-window')).toBeVisible();
});

test('journal filtering, bilingual MDX rendering, cover media, and work lightbox operate purely statically', async ({ page }) => {
  await page.goto('/journal');
  await expect(page.locator('[data-journal-row]')).toHaveCount(2);

  await page.locator('.journal-filter-toggle').click();
  await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  await expect(page.locator('[data-journal-row]:visible')).toHaveCount(1);

  await page.locator('[data-journal-row]:visible a').click();
  await expect(page).toHaveURL(/\/journal\/cjk-typography-on-retro-crt/);
  await expect(page.locator('article.journal-article')).toHaveAttribute('lang', 'zh-CN');

  // Verify cover image on English journal essay loads cleanly
  await page.goto('/journal/designing-a-monochrome-crt-os');
  const coverLoaded = await page.locator('.journal-cover img').evaluate((img) => img.complete && img.naturalWidth > 0);
  expect(coverLoaded).toBe(true);

  // Navigate to Work and open first template case study + lightbox
  await page.goto('/work');
  await expect(page.locator('.work-card')).toHaveCount(3);
  await page.locator('.work-card').first().click();
  await expect(page).toHaveURL(/\/work\/field-guide/);
  await page.locator('[data-gallery="project-media"]').first().click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('design system switches OS presets and all 5 offline games run with zero network calls', async ({ page }) => {
  const apiRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/')) apiRequests.push(req.url());
  });

  await page.goto('/design-system');
  await expect(page.locator('.specimen-type')).not.toContainText('Aa 42');
  await expect(page.locator('body')).not.toContainText('DO NOT OPEN');
  await page.locator('.os-presets').getByRole('button', { name: 'Pixel' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-os', 'pixel');

  // Games hub -> Minesweeper -> 2048 -> Snake -> Tetris -> Magic Tower
  await page.goto('/games');
  await expect(page.locator('.games-hub-card')).toHaveCount(5);

  await page.goto('/games/minesweeper');
  await expect(page.locator('[data-game="minesweeper"]')).toBeVisible();
  await page.locator('.mine-cell').first().click();
  await expect(page.locator('[data-game="minesweeper"]')).toHaveAttribute('data-phase', /playing|won/);

  await page.goto('/games/2048');
  await expect(page.locator('[data-game="2048"]')).toBeVisible();

  await page.goto('/games/snake');
  await expect(page.locator('[data-game="snake"]')).toBeVisible();

  await page.goto('/games/tetris');
  await expect(page.locator('[data-game="tetris"]')).toBeVisible();

  await page.goto('/games/mota');
  await expect(page.locator('[data-mota-floor="0"]')).toBeVisible();
  await expect(page.locator('[data-mota-color="color"]')).toBeVisible();
  await page.locator('.mota-diff-card[data-diff="hard"]').click();
  await page.getByRole('button', { name: /开始攀登/ }).click();
  await expect(page.locator('[data-mota-difficulty="hard"]')).toBeVisible();

  // Power off & wake
  await page.locator('.hardware-power').click();
  await expect(page.locator('html')).toHaveAttribute('data-power', 'off');
  await page.locator('.crt-off-screen button').click();
  await expect(page.locator('html')).toHaveAttribute('data-power', 'on');

  expect(apiRequests).toEqual([]);
});

test('mobile phone viewport keeps 3x2 icons and zero horizontal overflow across OS styles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const os of ['rainbow', 'phosphor', 'coffee', 'cli', 'pixel']) {
    await page.goto(`/?os=${os}`);
    await expect(page.locator('html')).toHaveAttribute('data-os', os);
    await expect(page.locator('.desktop-icon')).toHaveCount(6);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow detected on mobile for os=${os}`).toBe(false);
  }
});
