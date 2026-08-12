# PR Test Update Review — #139 and #116

**Date:** 2026-08-11
**Repo:** YSTEMandChess/react
**Scope:** Merge-conflict resolution, functional review, and test updates for two open PRs, prepared for maintainer review before merge.

---

## PR #139 — "Fix/join now navigation"

**Author:** dominhduy09
**Stated purpose:** Make the "Join Now" buttons on the homepage and mission page navigate to the signup page; adds a regression test.

### What was found

1. **No git-level conflicts** against current `main`. All files auto-merge cleanly.
2. **A silent bug the merge introduced:** `main` independently shipped its own fix for the same two "Join Now" buttons in `Home.tsx`, targeting `/signup/parent`. Because the PR's addition and main's addition landed on adjacent lines rather than overlapping ones, git's line-based merge did not flag a conflict — it just kept both `onClick` props on each `<button>`. Duplicate JSX attributes are valid syntax (no build error) but only the last one takes effect, so the buttons silently ended up navigating to `/signup/parent`, not the PR's intended `/signup`. This class of bug is invisible to `git merge` and would have shipped silently if merged without a human/manual check.
3. **The PR's own target route was broken regardless:** there is no `/signup` route registered in `AppRoutes.tsx` — only `/signup/parent`, `/signup/parent/add-child`, `/signup/parent/section`, and `/signup/mentor`. The PR's intended destination was a dead link.
4. **Same dead-link bug independently present in `Mission.tsx`**, which `main` never touched, so git had no reason to flag it. Both "Join Now" buttons there also targeted the nonexistent `/signup`.
5. **Scope note, now resolved by time:** this PR's branch also carried a large (~1,600-line) "Stockfish Tutor" feature bundled in alongside the navigation fix. As of the current `main`, that exact feature has since been merged separately and is now byte-for-byte identical between the PR branch and `main` (`StockfishTutor.tsx`, `PlayComputerWithTutor.tsx`, `StockfishTutor.module.scss`, `PlayComputer.tsx`, `stockfishServer/src/index.js`, `StockfishManager.js` all diff clean). Merging this PR today would not duplicate or reintroduce that feature — the only real delta left is the navigation fix itself.

### Changes made

| File | Change | Reason |
|---|---|---|
| `react-ystemandchess/src/features/home/Home.tsx` | Removed the duplicate `onClick`, keeping `navigate("/signup/parent")` | Fixes the invalid-JSX duplicate prop; keeps the destination that actually resolves to a route |
| `react-ystemandchess/src/features/about-us/mission/Mission.tsx` | Changed both "Join Now" buttons from `navigate("/signup")` → `navigate("/signup/parent")` | Same dead-link bug, same fix, for consistency |
| `react-ystemandchess/src/features/home/Home.test.tsx` | Updated the one assertion from `toHaveBeenCalledWith("/signup")` → `toHaveBeenCalledWith("/signup/parent")` | Test was asserting the broken behavior; updated to match the corrected, working route |
| `react-ystemandchess/src/AppRoutes.tsx` | Resolved (previously conflicting) import block in favor of main's structure | Main's version already includes the newer analytics route wiring; the PR's own addition there (`import React from "react"`) was unused dead code |

### Gap flagged, not fixed

- **`Mission.tsx` has no test file at all** — its "Join Now" buttons (and the bug living there) had zero test coverage before or after this change. Recommend the PR author or a follow-up add one; out of scope for this conflict-resolution pass since it wasn't part of the original PR's test additions.

### Test results

```
Full suite: 27 test suites, 150/150 tests passing (0 failures)
```

---

## PR #116 — "Test files for Footer.tsx, NavBar.tsx, and useChessSocket.tsx"

**Author:** AidenRangel12
**Stated purpose:** Add test coverage for three existing components. (PR description is empty; no reviewer comments exist on this PR to draw additional context from.)

### What was found

1. **One git conflict**, in `Footer.tsx`. Since this branch diverged, `main` has completely redesigned the Footer (new Tailwind layout with icon components) — a different, more thorough implementation of the same fix this PR was making (both broken social links now point to real URLs). Resolved in favor of main's version; reverting to the PR's old image-based markup would have undone a shipped redesign.
2. **The PR's actual payload — its two new test files — no longer matched the current components at all:**
   - `Footer.test.tsx` queried for `alt` text on `<img>` icons (`twitter-icon`, `instagram-icon`, etc.) and sponsor/partner logos. None of that markup exists anymore — main's redesigned Footer uses icon components with `aria-label`s and has no sponsor/partner section.
   - `NavBar.test.tsx` was written against an older `NavBar.tsx`. `NavBar.tsx` was also substantially rewritten on `main` (353 lines changed) since this branch diverged — but because this PR never modifies `NavBar.tsx` itself, git had no basis to flag a conflict here either. This is the same "invisible to git" pattern seen in PR #139.
3. **`useChessSocket.test.tsx`** required no changes — the hook it tests (`useChessSocket.tsx`) hasn't changed since the merge base, so the PR's existing updates to that test file were already valid.

### Changes made

| File | Change |
|---|---|
| `react-ystemandchess/src/components/footer/Footer.tsx` | Conflict resolved in favor of main's current redesigned implementation |
| `react-ystemandchess/src/components/footer/Footer.test.tsx` | **Fully rewritten.** New tests cover: branding/tagline text, contact info (phone `tel:` and email `mailto:` links), all four social links (Facebook, Instagram, Twitter/X, LinkedIn) with their exact current hrefs, and the copyright/year + Play-Learn-Empower footer tags |
| `react-ystemandchess/src/components/navbar/NavBar.test.tsx` | **One assertion fixed, two tests added.** The existing test suite (6 tests, mocking `SetPermissionLevel`, `useCookies`, `framer-motion`, FontAwesome, and `react-router-dom`'s `Link`) turned out to already match the current `NavBar.tsx` almost entirely — only the "Add Student" link's expected `href` was stale (`/parent-add-student` → corrected to the actual current route, `/signup/parent/add-child`). Added two new tests for the Analytics nav link, which is admin-only functionality that previously had no coverage at all: one confirming it renders for `role: "admin"`, one confirming it's hidden for other roles. |
| `useChessSocket.test.tsx` | No change needed |

### Test results

```
Footer.test.tsx:  4/4 passing
NavBar.test.tsx:  8/8 passing (6 original + 2 new)
Full suite:       29 test suites, 161/161 tests passing (0 failures)
```

---

## Summary for reviewers

Both PRs are now free of git-level conflicts and pass their full test suites against current `main`. The more important finding across both is the same pattern: **git's conflict detection only catches line-level text overlaps.** Both PRs had real, functional problems — a duplicate/overridden `onClick` handler, a dead-end route, and two test files asserting against UI that no longer exists — that a plain `git merge` would have accepted silently with zero warning. All of that required actually reading the merged output and running the test/build, not just resolving marked conflicts.

**Judgment calls made on your behalf, worth a second look:**
- Home/Mission "Join Now" buttons now point to `/signup/parent` (matching main's own already-shipped fix), not the PR's originally intended `/signup` — the latter was a dead link either way, but worth confirming this is the correct destination for this flow.
- Footer.tsx conflict resolved by taking main's version wholesale, not attempting to merge the PR's minor tweaks into the redesign — the PR's changes were fully superseded.
- The two new NavBar tests I added (Analytics link visibility) are new coverage I judged worth adding given the feature had none, not part of either PR's original scope — feel free to drop them if you'd rather keep this change minimal.

**Not yet done:** nothing has been staged, committed, or pushed for either PR. Both live in local worktrees pending your review of this document and go-ahead.
