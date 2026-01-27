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
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const TOPICS: Record<Subject, string[]> = {
  Mathematics: [
    "Algebra",
    "Geometry",
    "Calculus",
    "Trigonometry",
    "Statistics",
    "Probability",
  ],
  Physics: [
    "Mechanics",
    "Thermodynamics",
    "Electromagnetism",
    "Optics",
    "Modern Physics",
    "Waves",
  ],
  Chemistry: [
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Biochemistry",
  ],
  Biology: ["Cell Biology", "Genetics", "Ecology", "Human Physiology", "Botany", "Zoology"],
  English: ["Grammar", "Comprehension", "Vocabulary", "Writing Skills"],
  History: ["Ancient History", "Medieval History", "Modern History", "World History"],
  Geography: [
    "Physical Geography",
    "Human Geography",
    "Economic Geography",
    "Indian Geography",
  ],
  "Computer Science": [
    "Programming",
    "Data Structures",
    "Algorithms",
    "Databases",
    "Networking",
  ],
};
