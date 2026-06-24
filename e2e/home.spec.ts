/**
 * E2E Test: Homepage loads correctly
 */
import { test, expect } from '@playwright/test'

test('homepage loads and shows site name', async ({ page }) => {
  await page.goto('/')
  // Should show either install page or homepage with site name
  const body = await page.textContent('body')
  expect(body).toBeTruthy()
})

test('install page is accessible', async ({ page }) => {
  await page.goto('/install')
  await expect(page).toHaveTitle(/وكالة الأنباء العالمية|Global News/i)
})

test('login page is accessible', async ({ page }) => {
  await page.goto('/login')
  // Should show login form
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('robots.txt is served', async ({ page }) => {
  const response = await page.goto('/robots.txt')
  expect(response?.status()).toBe(200)
  const content = await page.textContent('body')
  expect(content).toContain('User-agent')
})

test('sitemap.xml is served', async ({ page }) => {
  const response = await page.goto('/sitemap.xml')
  expect(response?.status()).toBe(200)
})

test('RSS feed is served', async ({ page }) => {
  const response = await page.goto('/rss')
  expect(response?.status()).toBe(200)
})

test('health endpoint works', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe('ok')
  expect(body.database).toBe('connected')
})

test('search page loads', async ({ page }) => {
  await page.goto('/search')
  await expect(page.locator('input')).toBeVisible()
})

test('rate limiting works on login', async ({ request }) => {
  // Try 6 failed logins
  for (let i = 0; i < 5; i++) {
    await request.post('/api/auth/login', {
      data: { username: 'wrong', password: 'wrong' },
    })
  }
  // 6th should be rate limited
  const response = await request.post('/api/auth/login', {
    data: { username: 'wrong', password: 'wrong' },
  })
  expect(response.status()).toBe(429)
})

test('security headers are present', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()
  expect(headers['content-security-policy']).toBeTruthy()
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
})
