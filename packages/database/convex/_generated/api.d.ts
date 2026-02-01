/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as attempts from "../attempts.js";
import type * as batches from "../batches.js";
import type * as chat from "../chat.js";
import type * as classes from "../classes.js";
import type * as crons from "../crons.js";
import type * as fees from "../fees.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as orgJoinRequests from "../orgJoinRequests.js";
import type * as organizations from "../organizations.js";
import type * as questions from "../questions.js";
import type * as seed from "../seed.js";
import type * as tests from "../tests.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attempts: typeof attempts;
  batches: typeof batches;
  chat: typeof chat;
  classes: typeof classes;
  crons: typeof crons;
  fees: typeof fees;
  "lib/auth": typeof lib_auth;
  notes: typeof notes;
  notifications: typeof notifications;
  orgJoinRequests: typeof orgJoinRequests;
  organizations: typeof organizations;
  questions: typeof questions;
  seed: typeof seed;
  tests: typeof tests;
  userSettings: typeof userSettings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
