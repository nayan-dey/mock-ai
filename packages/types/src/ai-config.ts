/**
 * Centralized AI Model Configuration
 *
 * This file defines all AI models used in the application.
 * To switch models, simply update the constants below.
 */

// ==============================================
// GOOGLE GEMINI MODELS AVAILABLE
// ==============================================
export const AVAILABLE_GEMINI_MODELS = {
  FLASH_2_0: 'gemini-2.0-flash',                      // Stable, fast
  FLASH_2_5: 'gemini-2.5-flash',                // Improved reasoning & multimodal
  FLASH_3_PREVIEW: 'gemini-3-flash-preview',           // Latest - Pro-level intelligence at Flash speed
  FLASH_2_5_LITE: 'gemini-2.5-flash-lite',               // Lightweight, low-latency
} as const;

// ==============================================
// ACTIVE MODEL CONFIGURATION
// ==============================================

/**
 * Student Chat Model
 * Used for: Student AI assistant conversations
 * Recommended: Flash models for fast, cost-effective responses
 */
export const STUDENT_CHAT_MODEL = AVAILABLE_GEMINI_MODELS.FLASH_2_5_LITE;

/**
 * Admin Chat Model
 * Used for: Admin AI assistant conversations (data analysis, fee queries, etc.)
 * Recommended: Flash 2.5 for better reasoning needed for data analysis
 */
export const ADMIN_CHAT_MODEL = AVAILABLE_GEMINI_MODELS.FLASH_2_5;

/**
 * Admin Question Extraction Model
 * Used for: Extracting MCQ questions from images and documents
 * Recommended: Use multimodal-capable models with vision
 */
export const ADMIN_EXTRACTION_MODEL = AVAILABLE_GEMINI_MODELS.FLASH_3_PREVIEW;

/**
 * Model Selection Options for Admin UI
 * These models support vision/multimodal capabilities
 */
export const EXTRACTION_MODEL_OPTIONS = [
  {
    id: AVAILABLE_GEMINI_MODELS.FLASH_3_PREVIEW,
    name: 'Gemini 3 Flash Preview',
    description: 'Latest - Pro-level intelligence at Flash speed (Recommended)'
  },
  {
    id: AVAILABLE_GEMINI_MODELS.FLASH_2_5,
    name: 'Gemini 2.5 Flash',
    description: 'Strong reasoning & multimodal capabilities'
  },
  {
    id: AVAILABLE_GEMINI_MODELS.FLASH_2_0,
    name: 'Gemini 2.0 Flash',
    description: 'Stable, fast, cost-effective'
  },
  {
    id: AVAILABLE_GEMINI_MODELS.FLASH_2_5_LITE,
    name: 'Gemini 2.5 Flash Lite',
    description: 'Lightweight, low-latency, cheapest option'
  },
] as const;

// ==============================================
// MODEL PARAMETERS
// ==============================================

/**
 * Chat Model Parameters
 */
export const CHAT_MODEL_CONFIG = {
  maxTokens: 1000,
  temperature: 0.7,
  topP: 0.9,        // Gemini supports topP
  topK: 40,         // Gemini-specific parameter
} as const;

/**
 * Extraction Model Parameters
 */
export const EXTRACTION_MODEL_CONFIG = {
  temperature: 0.2,  // Lower temperature for more consistent JSON
  topP: 0.95,
  topK: 40,
} as const;

// ==============================================
// API CONFIGURATION
// ==============================================

/**
 * Environment variable key for Google API
 */
export const GOOGLE_API_KEY_ENV = 'GOOGLE_GENERATIVE_AI_API_KEY';
