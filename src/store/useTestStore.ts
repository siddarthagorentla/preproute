import { create } from 'zustand';
import { testService, questionService, subjectService, topicService } from '../api/services';
import type { Test, CreateTestPayload, UpdateTestPayload, Question, CreateQuestionPayload, Subject, Topic } from '../types';

interface TestState {
  tests: Test[];
  currentTest: Test | null;
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTests: () => Promise<void>;
  fetchTestById: (id: string) => Promise<Test | null>;
  fetchSubjects: () => Promise<void>;
  fetchTopics: (subjectId?: string) => Promise<void>;
  fetchQuestions: (testId: string) => Promise<void>;
  
  createTest: (payload: CreateTestPayload) => Promise<Test | null>;
  updateTest: (id: string, payload: UpdateTestPayload) => Promise<Test | null>;
  deleteTest: (id: string) => Promise<boolean>;
  publishTest: (id: string) => Promise<Test | null>;

  createQuestion: (payload: CreateQuestionPayload) => Promise<Question | null>;
  updateQuestion: (id: string, payload: Partial<CreateQuestionPayload>) => Promise<Question | null>;
  deleteQuestion: (id: string) => Promise<boolean>;
  clearCurrentTest: () => void;
  clearError: () => void;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  const castedErr = err as { response?: { data?: { message?: string } }; message?: string };
  return castedErr.response?.data?.message || castedErr.message || defaultMessage;
};

// ─── Local Mock Data for Demo Mode ────────────────────────
const MOCK_SUBJECTS: Subject[] = [
  { _id: 'sub-1', name: 'React Development' },
  { _id: 'sub-2', name: 'TypeScript Basics' },
  { _id: 'sub-3', name: 'NodeJS Backend' }
];

const MOCK_TOPICS: Topic[] = [
  { _id: 'top-1', name: 'React Hooks', subject: 'sub-1' },
  { _id: 'top-2', name: 'Zustand & Redux', subject: 'sub-1' },
  { _id: 'top-3', name: 'React Router', subject: 'sub-1' },
  { _id: 'top-4', name: 'Generics & Types', subject: 'sub-2' },
  { _id: 'top-5', name: 'Interfaces & Classes', subject: 'sub-2' },
  { _id: 'top-6', name: 'Express Server', subject: 'sub-3' },
  { _id: 'top-7', name: 'REST APIs', subject: 'sub-3' }
];

const INITIAL_DEMO_TESTS: Test[] = [
  {
    _id: 'demo-test-1',
    title: 'React Core Hooks Quiz',
    description: 'A mock evaluation evaluating hooks like useEffect, useMemo, and custom state controllers.',
    subject: 'sub-1',
    topics: ['top-1', 'top-2'],
    duration: 45,
    totalMarks: 40,
    marksPerQuestion: 10,
    negativeMarking: 2.5,
    status: 'draft',
    questions: ['demo-q-1', 'demo-q-2'],
    createdBy: 'demo-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_DEMO_QUESTIONS: Record<string, Question[]> = {
  'demo-test-1': [
    {
      _id: 'demo-q-1',
      text: 'Which Hook should you use to run side-effects in a React function component?',
      options: [
        { text: 'useState', isCorrect: false },
        { text: 'useEffect', isCorrect: true },
        { text: 'useMemo', isCorrect: false },
        { text: 'useCallback', isCorrect: false }
      ],
      test: 'demo-test-1',
      marks: 10,
      negativeMarks: 2.5,
      explanation: 'useEffect is specifically designed to handle side effects such as fetching data, subscription setups, or DOM manipulations.'
    },
    {
      _id: 'demo-q-2',
      text: 'What is the correct way to specify dependencies for useMemo?',
      options: [
        { text: 'As a second argument inside a dependency array', isCorrect: true },
        { text: 'Pass them directly to the callback function', isCorrect: false },
        { text: 'Dependencies are detected automatically', isCorrect: false },
        { text: 'useMemo does not accept dependencies', isCorrect: false }
      ],
      test: 'demo-test-1',
      marks: 10,
      negativeMarks: 2.5,
      explanation: 'Dependencies must be passed as an array in the second argument so React can check for equality on subsequent renders.'
    }
  ]
};

export const useTestStore = create<TestState>((set, get) => {
  const isDemo = () => localStorage.getItem('token') === 'mock-token';

  // Local helper: Load tests from LocalStorage
  const loadLocalTests = (): Test[] => {
    const data = localStorage.getItem('demo-tests');
    if (data) {
      try { return JSON.parse(data); } catch { /* ignore */ }
    }
    localStorage.setItem('demo-tests', JSON.stringify(INITIAL_DEMO_TESTS));
    return INITIAL_DEMO_TESTS;
  };

  // Local helper: Save tests to LocalStorage
  const saveLocalTests = (updated: Test[]) => {
    localStorage.setItem('demo-tests', JSON.stringify(updated));
  };

  // Local helper: Load questions for test from LocalStorage
  const loadLocalQuestions = (testId: string): Question[] => {
    const key = `demo-questions-${testId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try { return JSON.parse(data); } catch { /* ignore */ }
    }
    const defaults = INITIAL_DEMO_QUESTIONS[testId] || [];
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  };

  const saveLocalQuestions = (testId: string, updated: Question[]) => {
    localStorage.setItem(`demo-questions-${testId}`, JSON.stringify(updated));
  };

  return {
    tests: [],
    currentTest: null,
    subjects: [],
    topics: [],
    questions: [],
    isLoading: false,
    error: null,

    fetchTests: async () => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        set({ tests: local, isLoading: false });
        return;
      }
      try {
        const response = await testService.getAll();
        set({ tests: response.data, isLoading: false });
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to fetch tests'),
          isLoading: false,
        });
      }
    },

    fetchTestById: async (id: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        const found = local.find(t => t._id === id) || null;
        set({ currentTest: found, isLoading: false });
        return found;
      }
      try {
        const response = await testService.getById(id);
        set({ currentTest: response.data, isLoading: false });
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to fetch test details'),
          isLoading: false,
        });
        return null;
      }
    },

    fetchSubjects: async () => {
      if (get().subjects.length > 0) return;
      set({ isLoading: true, error: null });
      if (isDemo()) {
        set({ subjects: MOCK_SUBJECTS, isLoading: false });
        return;
      }
      try {
        const response = await subjectService.getAll();
        set({ subjects: response.data, isLoading: false });
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to fetch subjects'),
          isLoading: false,
        });
      }
    },

    fetchTopics: async (subjectId?: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const filtered = subjectId 
          ? MOCK_TOPICS.filter(t => t.subject === subjectId)
          : MOCK_TOPICS;
        set({ topics: filtered, isLoading: false });
        return;
      }
      try {
        const response = await topicService.getAll(subjectId);
        set({ topics: response.data, isLoading: false });
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to fetch topics'),
          isLoading: false,
        });
      }
    },

    fetchQuestions: async (testId: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalQuestions(testId);
        set({ questions: local, isLoading: false });
        return;
      }
      try {
        const response = await questionService.getAll(testId);
        set({ questions: response.data, isLoading: false });
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to fetch questions'),
          isLoading: false,
        });
      }
    },

    createTest: async (payload: CreateTestPayload) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        const newTest: Test = {
          _id: `mock-test-${Date.now()}`,
          title: payload.title,
          description: payload.description,
          subject: payload.subject,
          topics: payload.topics,
          duration: payload.duration,
          totalMarks: payload.totalMarks,
          marksPerQuestion: payload.marksPerQuestion,
          negativeMarking: payload.negativeMarking,
          status: 'draft',
          questions: [],
          createdBy: 'demo-user-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = [newTest, ...local];
        saveLocalTests(updated);
        set({
          tests: updated,
          currentTest: newTest,
          isLoading: false
        });
        return newTest;
      }
      try {
        const response = await testService.create(payload);
        set((state) => ({
          tests: [response.data, ...state.tests],
          currentTest: response.data,
          isLoading: false,
        }));
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to create test'),
          isLoading: false,
        });
        return null;
      }
    },

    updateTest: async (id: string, payload: UpdateTestPayload) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        const testIndex = local.findIndex(t => t._id === id);
        if (testIndex !== -1) {
          const updatedTest = {
            ...local[testIndex],
            ...payload,
            updatedAt: new Date().toISOString()
          } as Test;
          local[testIndex] = updatedTest;
          saveLocalTests(local);
          set({
            tests: local,
            currentTest: updatedTest,
            isLoading: false
          });
          return updatedTest;
        }
        set({ error: 'Test not found', isLoading: false });
        return null;
      }
      try {
        const response = await testService.update(id, payload);
        set((state) => ({
          tests: state.tests.map((t) => (t._id === id ? response.data : t)),
          currentTest: response.data,
          isLoading: false,
        }));
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to update test'),
          isLoading: false,
        });
        return null;
      }
    },

    deleteTest: async (id: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        const updated = local.filter(t => t._id !== id);
        saveLocalTests(updated);
        
        // Clean questions for deleted test
        localStorage.removeItem(`demo-questions-${id}`);

        set((state) => ({
          tests: updated,
          currentTest: state.currentTest?._id === id ? null : state.currentTest,
          isLoading: false,
        }));
        return true;
      }
      try {
        await testService.delete(id);
        set((state) => ({
          tests: state.tests.filter((t) => t._id !== id),
          currentTest: state.currentTest?._id === id ? null : state.currentTest,
          isLoading: false,
        }));
        return true;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to delete test'),
          isLoading: false,
        });
        return false;
      }
    },

    publishTest: async (id: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const local = loadLocalTests();
        const testIndex = local.findIndex(t => t._id === id);
        if (testIndex !== -1) {
          const updatedTest: Test = {
            ...local[testIndex],
            status: 'published',
            updatedAt: new Date().toISOString()
          };
          local[testIndex] = updatedTest;
          saveLocalTests(local);
          set({
            tests: local,
            currentTest: updatedTest,
            isLoading: false
          });
          return updatedTest;
        }
        set({ error: 'Test not found', isLoading: false });
        return null;
      }
      try {
        const response = await testService.publish(id);
        set((state) => ({
          tests: state.tests.map((t) => (t._id === id ? response.data : t)),
          currentTest: response.data,
          isLoading: false,
        }));
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to publish test'),
          isLoading: false,
        });
        return null;
      }
    },

    createQuestion: async (payload: CreateQuestionPayload) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        const qList = loadLocalQuestions(payload.test);
        const newQ: Question = {
          _id: `mock-q-${Date.now()}`,
          text: payload.text,
          options: payload.options,
          test: payload.test,
          marks: payload.marks,
          negativeMarks: payload.negativeMarks,
          explanation: payload.explanation
        };
        const updatedQs = [...qList, newQ];
        saveLocalQuestions(payload.test, updatedQs);

        // Update test question references count
        const localTests = loadLocalTests();
        const testIndex = localTests.findIndex(t => t._id === payload.test);
        if (testIndex !== -1) {
          const testQs = localTests[testIndex].questions as string[];
          localTests[testIndex].questions = [...testQs, newQ._id];
          saveLocalTests(localTests);
        }

        set({
          questions: updatedQs,
          isLoading: false
        });
        return newQ;
      }
      try {
        const response = await questionService.create(payload);
        set((state) => ({
          questions: [...state.questions, response.data],
          isLoading: false,
        }));
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to add question'),
          isLoading: false,
        });
        return null;
      }
    },

    updateQuestion: async (id: string, payload: Partial<CreateQuestionPayload>) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        if (!get().currentTest) return null;
        const testId = get().currentTest!._id;
        const qList = loadLocalQuestions(testId);
        const qIndex = qList.findIndex(q => q._id === id);
        if (qIndex !== -1) {
          const updatedQ = {
            ...qList[qIndex],
            ...payload
          } as Question;
          qList[qIndex] = updatedQ;
          saveLocalQuestions(testId, qList);
          set({
            questions: qList,
            isLoading: false
          });
          return updatedQ;
        }
        set({ error: 'Question not found', isLoading: false });
        return null;
      }
      try {
        const response = await questionService.update(id, payload);
        set((state) => ({
          questions: state.questions.map((q) => (q._id === id ? response.data : q)),
          isLoading: false,
        }));
        return response.data;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to update question'),
          isLoading: false,
        });
        return null;
      }
    },

    deleteQuestion: async (id: string) => {
      set({ isLoading: true, error: null });
      if (isDemo()) {
        if (!get().currentTest) return false;
        const testId = get().currentTest!._id;
        const qList = loadLocalQuestions(testId);
        const updatedQs = qList.filter(q => q._id !== id);
        saveLocalQuestions(testId, updatedQs);

        // Update test question references count
        const localTests = loadLocalTests();
        const testIndex = localTests.findIndex(t => t._id === testId);
        if (testIndex !== -1) {
          const testQs = localTests[testIndex].questions as string[];
          localTests[testIndex].questions = testQs.filter(qId => qId !== id);
          saveLocalTests(localTests);
        }

        set({
          questions: updatedQs,
          isLoading: false
        });
        return true;
      }
      try {
        await questionService.delete(id);
        set((state) => ({
          questions: state.questions.filter((q) => q._id !== id),
          isLoading: false,
        }));
        return true;
      } catch (err) {
        set({
          error: getErrorMessage(err, 'Failed to delete question'),
          isLoading: false,
        });
        return false;
      }
    },

    clearCurrentTest: () => set({ currentTest: null, questions: [] }),
    clearError: () => set({ error: null }),
  };
});
