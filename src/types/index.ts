// Auth types
export interface LoginCredentials {
  userId: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: User;
}

export interface User {
  _id: string;
  userId: string;
  name: string;
  role: string;
}

// Test types
export interface Test {
  _id: string;
  title: string;
  description: string;
  subject: Subject | string;
  topics: Topic[] | string[];
  duration: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  status: 'draft' | 'published' | 'archived';
  questions: Question[] | string[];
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
  difficulty?: string;
  testType?: string;
  subTopic?: string;
  unattemptedMarks?: number;
  noOfQuestions?: number;
}

export interface CreateTestPayload {
  title: string;
  description: string;
  subject: string;
  topics: string[];
  duration: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  difficulty?: string;
  testType?: string;
  subTopic?: string;
  unattemptedMarks?: number;
  noOfQuestions?: number;
}

export interface UpdateTestPayload extends Partial<CreateTestPayload> {
  status?: 'draft' | 'published' | 'archived';
}

// Subject types
export interface Subject {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Topic types
export interface Topic {
  _id: string;
  name: string;
  subject: Subject | string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Question types
export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  text: string;
  options: Option[];
  test: Test | string;
  marks: number;
  negativeMarks: number;
  explanation?: string;
  createdAt?: string;
  updatedAt?: string;
  difficulty?: string;
  topic?: string;
  subTopic?: string;
}

export interface CreateQuestionPayload {
  text: string;
  options: Option[];
  test: string;
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  subTopic?: string;
}

// API Response types
export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}
