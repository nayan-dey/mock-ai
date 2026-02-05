# Security & Implementation Audit - Mock Test App

## CRITICAL (Must fix before production)

### ~~1. Unprotected Convex Mutations - Anyone Can Call These Without Auth~~ FIXED
- [x] **`users.create`** ~~Creates users without ANY authentication.~~ Now uses `requireMatchingIdentity` to verify caller's JWT identity matches the clerkId being created.
- [x] **`users.upsertFromClerk`** ~~Creates/updates student accounts without auth.~~ Now uses `requireMatchingIdentity` to verify caller owns the clerkId.
- [x] **`users.upsertAsAdmin`** ~~Creates/updates admin accounts without auth.~~ Now uses `requireMatchingIdentity` to verify caller owns the clerkId.
- [x] **`users.getByClerkId`** ~~Public query returns user data by clerkId.~~ Now uses `requireMatchingIdentity` — users can only query their own record.

### ~~2. Cross-Org Data Leakage - Admin from Org A Can Access Org B's Data~~ FIXED
- [x] **`analytics.getTestAnalytics`** ~~No org boundary check.~~ Now verifies test belongs to admin's org.
- [x] **`attempts.getByTest`** ~~No org validation.~~ Now verifies test belongs to admin's org.
- [x] **`tests.getById`** ~~Any authenticated user can fetch ANY test.~~ Now checks `user.organizationId` matches test's org.
- [x] **`tests.getWithQuestions`** ~~Any authenticated user can fetch test questions from any org.~~ Now checks org match.
- [x] **`questions.getById` / `questions.getByIds`** ~~Admin can fetch questions from any org.~~ Now filters by admin's org.
- [x] **`batches.getById`** ~~Any authenticated user can fetch any batch.~~ Now checks org match.
- [x] **`batches.getStudentsByBatch`** ~~Admin can list students in any batch.~~ Now verifies batch belongs to admin's org.
- [x] **`batches.assignUserToBatch`** ~~Admin can assign students to batches in other orgs.~~ Now verifies both batch and user belong to admin's org.
- [x] **`batches.removeUserFromBatch`** ~~Admin can remove students from other orgs.~~ Now verifies user belongs to admin's org.
- [x] **`notes.getById`** ~~Any authenticated user can fetch any note.~~ Now checks org match.
- [x] **`classes.getById`** ~~Any authenticated user can fetch any class.~~ Now checks org match.

### ~~3. Cross-Org Role Manipulation~~ FIXED
- [x] **`users.updateRole`** ~~Admin can change ANY user's role without org check.~~ Now verifies target user belongs to the same org as the calling admin.

### 4. Unprotected API Route
- [ ] **`/api/extract-questions`** (admin app) - NO authentication check. Public endpoint that processes files via Google Gemini API. Anyone can call it, burning your API credits and potentially using it for free AI processing.

**Fix:** Add `const { userId } = await auth(); if (!userId) return new Response("Unauthorized", { status: 401 });`

---

## HIGH (Should fix before production)

### 5. ~~No Rate Limiting on AI Chat~~ FIXED
- [x] **`chat.getDailyMessageCount`** ~~returns hardcoded `Infinity` for limits. No actual rate limiting exists.~~ Now enforced via `consumeChatLimit` mutation. Students: 3/day, Admins: 10/day. Uses `chatRateLimits` table with auto-reset on date change. Client-side enforcement via `useMutation` in chat providers with toast notification.
- [x] **AI Extract rate limiting** added. `consumeExtractLimit` mutation with 5/day limit for admins. Uses `extractRateLimits` table. Enforced client-side in extract page.

### 6. Chat API Context Fallback
- [ ] **Student chat API** (`/apps/student/api/chat/route.ts`) falls back to client-provided context if server fetch fails. A student could inject fake context to manipulate AI responses.

**Fix:** Remove client-side fallback. Require server-side context always; return error if it fails.

### 7. Teachers Can Take Mock Tests
- [ ] **`attempts.start`** has no role check - ANY authenticated user (teacher, admin) can start a test attempt. Teachers with the "teacher" role can take student tests and appear on leaderboards.
- [ ] Teacher role is defined in schema but has no dedicated functionality or restrictions.

**Fix:** Add role check in `attempts.start` to only allow students. Or define what teachers should/shouldn't be able to do.

### 8. Client-Side Role Enforcement Only
- [ ] Admin/student portal separation happens client-side in `UserSync` components. The Convex mutations (`upsertAsAdmin`, `upsertFromClerk`) are the actual role assignment - and they're unprotected (see #1).
- [ ] No webhook-based user sync. All user creation happens client-side, making it manipulable.

**Fix:** Move user sync to Clerk webhooks with signature verification, or add identity verification in the mutations.

---

## MEDIUM (Fix soon after launch)

### 9. Test Timer Has 30-Second Grace Period
- [ ] **`attempts.submit`** allows submission up to 30 seconds after test duration expires. Students get unfair extra time.

**Fix:** Reduce grace period to 5 seconds (network latency buffer only).

### 10. Referral Codes Are Brute-Forceable
- [ ] Referral codes are 6-character alphanumeric strings. With ~2 billion combinations, automated brute-force could find valid codes.
- [ ] `batches.getByReferralCode` is accessible to any authenticated user without rate limiting.

**Fix:** Increase code length to 10-12 characters, or add rate limiting on referral code lookups.

### 11. Onboarding Page Re-accessible
- [ ] Already-onboarded students can navigate back to `/onboarding`. No server-side check prevents re-onboarding.

**Fix:** Check if user already has `batchId` on the onboarding page and redirect to dashboard.

### 12. No Input Sanitization on Text Fields
- [ ] Question text, test descriptions, note titles, chat messages - none have length limits or content sanitization in Convex mutations.
- [ ] Could lead to XSS if rendered unsafely, or storage abuse with very large payloads.

**Fix:** Add `v.string()` length validators in Convex schema. Sanitize HTML in rendered content.

### ~~13. Student Can See Other Org's Data via Direct ID Access~~ FIXED
- [x] ~~If a student somehow obtains a test ID, note ID, or class ID from another org, the `getById` queries will return that data since there's no org check.~~ All `getById` queries now verify `user.organizationId` matches the record's org. Fixed as part of #2.

---

## LOW (Good to fix, not blocking)

### 14. No Audit Logging
- [ ] No logging of admin actions (user suspension, role changes, fee management, test creation). If something goes wrong, there's no trail.

### 15. Organization Verification is Manual
- [ ] New orgs have `isVerified: false` and must be manually verified in the Convex dashboard. No admin UI for this.

### 16. Developer Seed Tool in Code
- [ ] Seed functionality exists in both apps. While gated by `NODE_ENV`, ensure it's completely disabled in production builds.

### 17. Phone Number Uniqueness Not Enforced
- [ ] Two students can register with the same phone number. The schema doesn't enforce uniqueness on phone numbers across the `users` table.

**Fix:** Add a unique index on phone number, or validate during onboarding.

### 18. `isSuperAdmin` Check Uses Identity Directly
- [ ] `organizations.isSuperAdmin` queries `orgAdmins` table using identity without going through the user record. Could be out of sync.

### 19. Convex Free Tier Limits
- [ ] With 5000 students and 10k notifications, monitor these Convex free tier limits:
  - Database storage: 1GB (documents + indexes)
  - Bandwidth: 1GB/month
  - Function calls: 1M/month
  - File storage: 1GB
- [ ] The `cleanupOldNotifications` cron helps, but heavy usage could exceed limits.
- [ ] Clerk free tier: 10,000 monthly active users (should be fine for 5000 students + admins).

---

## ARCHITECTURE CONCERNS

### 20. Same Clerk User Can't Be Both Admin and Student
- [ ] The `upsertFromClerk` mutation throws if user is already an admin, and `upsertAsAdmin` throws if user is already a student. This is intentional but means a person needs two Clerk accounts to be both.

### 21. Batch Deletion Doesn't Clean Up All Related Data
- [ ] When a batch is deleted, user `batchId` fields are cleared, but related test access (if tests are batch-scoped), attempt history, fees, and notes may become orphaned.

### 22. No Soft Delete Pattern
- [ ] Tests use `isArchived` flag (good), but questions, notes, classes use hard delete. No recovery possible.

---

## SUMMARY

| Priority | Count | Action |
|----------|-------|--------|
| CRITICAL | 1 open / 3 fixed (14 functions) | **Must fix before production** |
| HIGH | 3 open / 1 fixed | **Should fix before production** |
| MEDIUM | 4 open / 1 fixed | Fix soon after launch |
| LOW | 6 issues | Good to fix when possible |
| Architecture | 3 concerns | Design decisions to evaluate |

---

## FILES TO MODIFY

### ~~Step 1: Add org validation to all `getById` queries~~ DONE
- ~~`packages/database/convex/tests.ts` - `getById`, `getWithQuestions`~~
- ~~`packages/database/convex/questions.ts` - `getById`, `getByIds`~~
- ~~`packages/database/convex/batches.ts` - `getById`, `getStudentsByBatch`, `assignUserToBatch`, `removeUserFromBatch`~~
- ~~`packages/database/convex/notes.ts` - `getById`~~
- ~~`packages/database/convex/classes.ts` - `getById`~~
- ~~`packages/database/convex/analytics.ts` - `getTestAnalytics`~~
- ~~`packages/database/convex/attempts.ts` - `getByTest`~~
- ~~`packages/database/convex/users.ts` - `updateRole`~~
- All 14 functions now verify the record's `organizationId` matches the caller's org before returning data

### ~~Step 2: Secure unprotected mutations~~ DONE
- ~~`packages/database/convex/users.ts` - Add identity verification to `create`, `upsertFromClerk`, `upsertAsAdmin`, `getByClerkId`~~
- Added `requireMatchingIdentity` helper to `packages/database/convex/lib/auth.ts`
- All 4 functions now verify caller's JWT `subject` matches the `clerkId` argument

### Step 3: Secure API routes
- `apps/admin/app/api/extract-questions/route.ts` - Add auth check

### ~~Step 4: Add rate limiting to chat~~ DONE
- ~~`packages/database/convex/chat.ts` - Implement actual `getDailyMessageCount`~~
- Added `consumeChatLimit` mutation, `consumeExtractLimit` mutation, `chatRateLimits` table, `extractRateLimits` table
- Wired in `apps/student/components/ai-chat/chat-provider.tsx` and `apps/admin/components/ai-chat/chat-provider.tsx`
- Wired extraction limit in `apps/admin/app/(dashboard)/questions/extract/page.tsx`

### Step 5: Add role check to test attempts
- `packages/database/convex/attempts.ts` - Add student role check in `start`

### Step 6: Fix chat API fallback
- `apps/student/app/api/chat/route.ts` - Remove client context fallback
