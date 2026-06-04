import api from './axios';
import type {
  LoginCredentials,
  AuthResponse,
  Test,
  CreateTestPayload,
  UpdateTestPayload,
  Question,
  CreateQuestionPayload,
  Subject,
  Topic,
} from '../types';

// ─── Auth ────────────────────────────────────────────────
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
};

// ─── Tests ───────────────────────────────────────────────
export const testService = {
  getAll: async (): Promise<{ data: Test[] }> => {
    const { data } = await api.get('/tests');
    return data;
  },

  getById: async (id: string): Promise<{ data: Test }> => {
    const { data } = await api.get(`/tests/${id}`);
    return data;
  },

  create: async (payload: CreateTestPayload): Promise<{ data: Test }> => {
    const { data } = await api.post('/tests', payload);
    return data;
  },

  update: async (id: string, payload: UpdateTestPayload): Promise<{ data: Test }> => {
    const { data } = await api.put(`/tests/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tests/${id}`);
  },

  publish: async (id: string): Promise<{ data: Test }> => {
    const { data } = await api.put(`/tests/${id}`, { status: 'published' });
    return data;
  },
};

// ─── Questions ───────────────────────────────────────────
export const questionService = {
  getAll: async (testId?: string): Promise<{ data: Question[] }> => {
    const params = testId ? { test: testId } : {};
    const { data } = await api.get('/questions', { params });
    return data;
  },

  getById: async (id: string): Promise<{ data: Question }> => {
    const { data } = await api.get(`/questions/${id}`);
    return data;
  },

  create: async (payload: CreateQuestionPayload): Promise<{ data: Question }> => {
    const { data } = await api.post('/questions', payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateQuestionPayload>): Promise<{ data: Question }> => {
    const { data } = await api.put(`/questions/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },
};

// ─── Subjects ────────────────────────────────────────────
export const subjectService = {
  getAll: async (): Promise<{ data: Subject[] }> => {
    const { data } = await api.get('/subjects');
    return data;
  },
};

// ─── Topics ──────────────────────────────────────────────
export const topicService = {
  getAll: async (subjectId?: string): Promise<{ data: Topic[] }> => {
    const params = subjectId ? { subject: subjectId } : {};
    const { data } = await api.get('/topics', { params });
    return data;
  },
};
