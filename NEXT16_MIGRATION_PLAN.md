# Dependency and Next.js 16 migration plan (separate from OTP rollout)

Status: **applied in the isolated worktree `stage2/dependency-remediation` and
verified; not committed, merged, deployed, or applied to production.** The
original OTP work was preserved in that worktree.

## Stage 2 result (2026-10-29)

| Item | Result |
|---|---|
| Runtime declaration | `.nvmrc` `22.12.0`; `package.json` and lockfile root `engines` `>=22.12.0` |
| Sanitizer | `sanitize-html@2.18.1`; `deepmerge` removed |
| Framework | `next@16.4.3`; `react@19.2.0`; `react-dom@19.2.0` |
| Next.js build | Passed with Turbopack |
| `next start` smoke | 22/22 checks passed |
| `node server.js` smoke | 22/22 checks passed |
| Sanitizer regression suite | 9/9 passed |
| OTP suite | 43/43 passed |
| Production fail-closed suite | 8/8 passed |
| Supabase-outage suite | 2/2 passed |
| Final `npm audit` | 0 findings |
| Local runtimes used for verification | Node.js `24.22.2` and `26.8.1`; Vercel project remains `24.x` |

The runtime guard is now consistent, but the HostSeba runtime remains
unverified. `next lint` was removed by Next 16; the obsolete `lint` script was
removed rather than adding a new ESLint dependency/configuration.

## 1. Current audit

The Stage 2 baseline `npm audit` reported 4 findings. After the isolated
sanitizer and framework upgrades, the final audit reports 0 findings.

| Package | Severity | Why | Fixed by |
|---|---|---|---|
| `next@14.2.35` | critical | Multiple Next.js advisories, including RSC/Image Optimizer DoS, request smuggling, cache poisoning, and Windows RCE issues | `next@16.4.3` (semver-major) |
| `postcss@8.4.31` (transitive under Next) | high | XSS/source-map path traversal advisories | `next@16.4.3`, which depends on `postcss@8.5.23` |
| `sanitize-html@2.18.0` | moderate | Unbounded recursion when re-sanitizing discarded iframe fallback | `sanitize-html@2.18.1` |
| `deepmerge@4.3.1` (transitive under sanitize-html) | low | Prototype poisoning in `mergeObject()` | `sanitize-html@2.18.1`, which removes the dependency |

Do **not** run `npm audit fix --force`: it would jump Next.js across major
versions and combine that with unrelated changes.

## 2. Runtime prerequisite

The current dependency set is already inconsistent with the repository runtime
declaration:

| Source | Declared runtime |
|---|---|
| Vercel project | Node.js `24.x` |
| Local test runtime | Node.js `26.8.1` |
| `@supabase/supabase-js@2.117.2` (installed lock) | Node.js `>=22.0.0` |
| `sanitize-html@2.18.1` (target patch) | Node.js `>=22.12.0` |
| Next.js `16.4.3` | Node.js `>=20.9.0` |
| `.nvmrc` (updated) | `22.12.0` |
| `package.json` / lockfile root `engines` (updated) | `>=22.12.0` |

Therefore the safe runtime baseline is **Node.js 22.12.0 or newer**. Vercel is
already on 24.x; HostSeba compatibility is still unverified. The runtime change
was applied together in `.nvmrc`, `package.json`, and the lockfile root. Vercel
24.x satisfies the declaration; confirm the deployed runtime after release.

## 3. Smallest sanitize-html patch (applied)

Target: `sanitize-html@2.18.1`; applied as a separate dependency step before the
framework upgrade.

- It is the first release outside the affected range `2.0.0-beta - 2.18.0`.
- It removes `deepmerge`, clearing the low finding.
- Its `postcss` range is `^8.5.27`, outside the high range.
- It raises the engine requirement to Node.js `>=22.12.0`.

Applied isolated sequence:

1. Updated `.nvmrc`, `package.json` `engines`, and lockfile root metadata to
   Node.js 22.12+.
2. Added `scripts/test-sanitize.mjs` (9 checks) against the actual
   `lib/sanitize.js`; the nested-iframe regression reproduced the 2.18.0
   `RangeError` before the upgrade.
3. Updated the dependency range to `^2.18.1` and installed the lockfile.
4. Confirmed `deepmerge` was removed and the sanitizer findings cleared.
5. Ran the production build, OTP, fail-closed, outage, and storefront smoke
   suites; all passed.
6. Left the change uncommitted for review. It must be committed separately
   from the OTP rollout and the Next.js change.

## 4. Next.js 16.4.3 migration

### 4.1 Framework and React packages

- Upgraded to `next@16.4.3`, `react@19.2.0`, and `react-dom@19.2.0` together.
- No `@types/react` or `@types/react-dom` packages are installed; none were
  added. The project uses JavaScript source, and Next's build-time TypeScript
  check completed without errors.
- Kept the existing TypeScript dev range.
- Did not use `npm audit fix --force`.
- Performed the work in the isolated `stage2/dependency-remediation` worktree;
  the OTP changes were replayed into that worktree and preserved.

### 4.2 Dynamic route parameters

Next 16 removes the synchronous compatibility period for `params` and
`searchParams`. Every dynamic page, metadata function, and route handler now
awaits them:

- `app/category/[slug]/page.jsx` — awaits `params` and destructures `slug`.
- `app/page/[slug]/page.jsx` — `generateMetadata` and the page component both
  await `params`.
- `app/product/[slug]/page.jsx` — client page now uses `useParams()`.
- `app/api/admin/pages/[slug]/route.js` — `GET`, `PUT`, and `DELETE` await
  `params`.
- `app/api/admin/promo-cards/[id]/route.js` — `PUT` and `DELETE` await `params`.
- `app/api/products/[slug]/reviews/route.js` — `GET` and `POST` await `params`.

No `generateStaticParams` or `generateSitemaps` is present. `app/search/page.jsx`
uses `useSearchParams` inside a `<Suspense>` boundary; no server page currently
reads `searchParams`. `app/api/orders/route.js` uses
`request.nextUrl.searchParams`, which remains valid.

### 4.3 Route handlers and request APIs

- No application source uses `cookies()`, `headers()`, or `draftMode()` from
  `next/headers`; the `headers()` calls in `app/admin/page.jsx` are a local
  helper and are unaffected.
- No `middleware.js` or `proxy.js` exists. Next 16 renames middleware to proxy
  and does not support Edge runtime in proxy; there is nothing to rename here.
  If middleware is added later, choose the runtime deliberately.
- No rewrites, custom webpack config, `serverRuntimeConfig`, or
  `publicRuntimeConfig` is present. `next.config.mjs` uses only supported
  `images.unoptimized` and static `headers()` behavior.
- Next 16 uses Turbopack by default for `next dev` and `next build`. There is no
  custom webpack configuration, so the build should not need a `--webpack`
  fallback. Verify the custom `server.js` and `next start` paths separately.
- `next lint` is removed in Next 16 and `next build` no longer lints. The
  obsolete `lint` script was removed. No ESLint dependency or configuration is
  present; add ESLint/Biome separately if CI linting is required.
- Metadata image route `app/opengraph-image.jsx` still uses `runtime = 'edge'`.
  It builds and `/opengraph-image` returned `200 image/png` under both
  `next start` and the custom server. Next 16 prints an Edge Runtime deprecation
  warning; plan to move this route to the Node runtime separately.
- `components/PageSections.jsx` uses `next/image` with arbitrary CMS URLs. The
  project has `images.unoptimized: true`, so the new optimizer restrictions
  should not affect it, but run a page with a CMS image and an external URL.
- No parallel-route slots are present, so the Next 16 `default.js` requirement
  does not apply.

### 4.4 Upgrade sequence and result

1. Recorded `HEAD 3c411c7`, the clean production build, and the green OTP /
   fail-closed / outage baselines.
2. Created the isolated `stage2/dependency-remediation` worktree and replayed
   every tracked and untracked source file; verified all 172 hashes matched.
3. Aligned `.nvmrc`, `engines`, and lockfile root metadata to Node 22.12+.
4. Applied the framework and React upgrade manually. The official codemods
   were not used; the affected `params` call sites were reviewed and edited
   directly.
5. Awaiting/deferring lint configuration: `lint` was removed rather than adding
   an unconfigured ESLint dependency.
6. Ran `npm audit` (0 findings), the production build, the sanitizer suite, OTP
   43/43, fail-closed 8/8, outage 2/2, and 44/44 production smoke checks across
   `next start` and `node server.js`.
7. Verified `/opengraph-image` (200 image/png), CMS page `/page/demo-page`,
   product `/product/almond`, category `/category/nuts`, search, admin shell,
   sitemap/robots, public APIs, and the review API. The valid-product POST was
   deliberately rejected at validation (`400`) so no review row was written.
8. Remaining deployment steps: preview deploy, verify the Vercel runtime reports
   24.x (within the `>=22.12.0` declaration), and smoke-test the preview. Do not
   combine this with the OTP production rollout or DNS cutover.

### 4.5 Rollback

- Keep the current `package.json`/`package-lock.json` as the rollback point.
- Vercel can roll back the deployment; revert the isolated dependency commit if
  the preview fails.
- Do not run `npm audit fix --force` or partially upgrade Next/React in
  production.
- The OTP rollout must remain independently deployable and tested; a framework
  rollback must not require rolling back the OTP table or Resend configuration.

## 5. Current decision

- Stage 2 is complete in the isolated worktree and is pending review/approval.
- Dependency audit is clean: 0 findings after `next@16.4.3`,
  `react@19.2.0`, `sanitize-html@2.18.1`, and the lockfile update.
- The OTP implementation was not changed by Stage 2 except for the required
  async `params` edits in the three dynamic API route families and the two CMS
  dynamic pages; all OTP security suites still pass.
- Remaining non-blocking warnings: Next 16 Edge Runtime deprecation for
  `app/opengraph-image.jsx`; existing site-settings dynamic-fetch fallback logs
  during static generation. The image route and fallback behavior work.
- Remaining operational work: confirm the Vercel 24.x runtime after preview
  deployment, confirm HostSeba's runtime if that host is used, and add lint/
  ESLint configuration separately if CI requires it.
- No commits, pushes, deployments, migrations, DNS changes, or real emails were
  performed in Stage 2.
