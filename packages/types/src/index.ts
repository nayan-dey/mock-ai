// User types
export type UserRole = "student" | "teacher" | "admin";

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

// Question types
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  _id: string;
  text: string;
  options: string[];
  correctOptions: number[];
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  createdBy: string;
  createdAt: number;
}

export interface QuestionFormData {
  text: string;
  options: string[];
  correctOptions: number[];
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
}

// Test types
export type TestStatus = "draft" | "published" | "archived";

export interface Test {
  _id: string;
  title: string;
  description: string;
  questions: string[];
  duration: number;
  totalMarks: number;
  negativeMarking: number;
  status: TestStatus;
  scheduledAt?: number;
  createdBy: string;
  createdAt: number;
}

export interface TestFormData {
  title: string;
  description: string;
  questions: string[];
  duration: number;
  totalMarks: number;
  negativeMarking: number;
  status: TestStatus;
  scheduledAt?: number;
}

// Test Attempt types
export type AttemptStatus = "in_progress" | "submitted" | "expired";

export interface Answer {
  questionId: string;
  selected: number[];
}

export interface TestAttempt {
  _id: string;
  testId: string;
  userId: string;
  answers: Answer[];
  score: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  startedAt: number;
  submittedAt?: number;
  status: AttemptStatus;
}

// Notes types
export interface Note {
  _id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  fileUrl: string;
  createdBy: string;
  createdAt: number;
}

export interface NoteFormData {
  title: string;
  description: string;
  subject: string;
  topic: string;
  fileUrl: string;
}

// Recorded Classes types
export interface RecordedClass {
  _id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string;
  createdBy: string;
  createdAt: number;
}

export interface RecordedClassFormData {
  title: string;
  description: string;
  subject: string;
  topic: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string;
}

// Analytics types
export interface StudentAnalytics {
  totalTestsTaken: number;
  averageScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  subjectWisePerformance: Record<string, { correct: number; total: number }>;
}

export interface TestAnalytics {
  testId: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  questionWiseAnalysis: {
    questionId: string;
    correctAttempts: number;
    totalAttempts: number;
  }[];
}

// Common filter types
export interface QuestionFilters {
  subject?: string;
  topic?: string;
  difficulty?: Difficulty;
}

export interface TestFilters {
  status?: TestStatus;
  subject?: string;
}

// AI Question Extraction types
export interface ExtractedQuestion {
  text: string;
  options: string[];
  correctOptions: number[];
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  confidence: number; // 0-1 confidence score from AI
  needsReview: boolean; // Flag for questions that may need manual review
  reviewReason?: string; // Reason why the question needs review
}

export interface ExtractionResult {
  success: boolean;
  questions: ExtractedQuestion[];
  totalExtracted: number;
  needsReviewCount: number;
  error?: string;
}

// Subject and topic constants
export const SUBJECTS = [
  "General Knowledge",
  "Mathematics",
  "Reasoning",
  "Bengali",
  "English",
  "General Science",
  "Indian History",
  "Geography",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const TOPICS: Record<Subject, string[]> = {
  "General Knowledge": [
    "Current Affairs",
    "Indian Polity",
    "Indian Economy",
    "Sports",
    "Awards & Honours",
    "West Bengal GK",
  ],
  Mathematics: [
    "Number System",
    "Percentage",
    "Profit & Loss",
    "Time & Work",
    "Time & Distance",
    "Algebra",
  ],
  Reasoning: [
    "Analogy",
    "Series",
    "Coding-Decoding",
    "Blood Relations",
    "Direction Sense",
    "Syllogism",
  ],
  Bengali: [
    "ব্যাকরণ (Grammar)",
    "সাহিত্য (Literature)",
    "পদ্যাংশ (Comprehension)",
    "শব্দভাণ্ডার (Vocabulary)",
  ],
  English: ["Grammar", "Comprehension", "Vocabulary", "Error Spotting"],
  "General Science": [
    "Physics",
    "Chemistry",
    "Biology",
    "Environmental Science",
  ],
  "Indian History": [
    "Ancient India",
    "Medieval India",
    "Modern India",
    "Freedom Movement",
  ],
  Geography: [
    "Physical Geography",
    "Indian Geography",
    "West Bengal Geography",
    "World Geography",
  ],
};

// Export AI configuration
export * from './ai-config';
