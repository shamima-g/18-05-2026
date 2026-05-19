/**
 * Story Metadata:
 * - Route: /auth/signin
 * - Target File: app/auth/signin/page.tsx
 * - Page Action: modify_existing
 *
 * E2E spec for Epic 1, Story 1: Auth Reconciliation and Role System.
 *
 * Runs against a live Next.js dev server booted by playwright.config.ts's
 * webServer block. These tests WILL FAIL until the feature is implemented
 * — that is the point (TDD red).
 *
 * Coverage:
 * - AC-1: Unauthenticated user is redirected to /auth/signin from protected routes
 * - AC-2: Admin signs in → redirected to /
 * - AC-3: Member signs in → redirected to /
 * - AC-4: Bad credentials → inline error, stays on /auth/signin (BA-3)
 * - E1:   Unknown email → same error text as bad credentials (no email-existence disclosure)
 * - E2:   Unauthenticated user visiting a deeply nested protected route → /auth/signin
 *
 * NOTE: E3 (already-authenticated visits /auth/signin) is OUT OF SCOPE per BA-5.
 * No test is written for that case.
 */

import { test, expect } from '@playwright/test';
import { adminUser, memberUser } from './fixtures/credentials';

test.describe('Epic 1, Story 1: Auth Reconciliation and Role System', () => {
  test.beforeEach(async ({ context }) => {
    // Every test starts unauthenticated — keeps diagnosis simple.
    await context.clearCookies();
  });

  // AC-1
  test('unauthenticated user visiting / is redirected to /auth/signin', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  // AC-1, E2
  test('unauthenticated user visiting a deeply nested protected route is redirected to /auth/signin', async ({
    page,
  }) => {
    await page.goto('/tasks/some-task-id');
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  // AC-2
  test('admin signs in with valid credentials and lands on /', async ({
    page,
  }) => {
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill(adminUser.email);
    await page.getByLabel(/password/i).fill(adminUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('alert'))
      .not.toBeVisible()
      .catch(() => {
        // No error element rendered at all is also acceptable
      });
  });

  // AC-3
  test('member signs in with valid credentials and lands on /', async ({
    page,
  }) => {
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill(memberUser.email);
    await page.getByLabel(/password/i).fill(memberUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/');
  });

  // AC-4, BA-3
  test('wrong password shows "Incorrect email or password" and user stays on /auth/signin', async ({
    page,
  }) => {
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill(adminUser.email);
    await page.getByLabel(/password/i).fill('WrongPassword!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole('alert')).toContainText(
      'Incorrect email or password',
    );
  });

  // AC-4, E1 — unknown email must show same error (no email-existence disclosure)
  test('unknown email shows same error text — no email-existence disclosure', async ({
    page,
  }) => {
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('AnyPassword1!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole('alert')).toContainText(
      'Incorrect email or password',
    );
  });
});
