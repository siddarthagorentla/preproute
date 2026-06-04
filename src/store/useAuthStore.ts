import { create } from 'zustand';
import { authService } from '../api/services';
import type { LoginCredentials, User } from '../types';
import toast from 'react-hot-toast';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe parsing of user object from localStorage
  const getInitialUser = (): User | null => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  };

  return {
    token: localStorage.getItem('token'),
    user: getInitialUser(),
    isLoading: false,
    error: null,

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.login(credentials);
        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          set({
            token: response.token,
            user: response.user,
            isLoading: false,
            error: null,
          });
          return true;
        } else {
          set({
            isLoading: false,
            error: response.message || 'Login failed. Invalid credentials.',
          });
          return false;
        }
      } catch (err) {
        // Fallback to Local Demo Mode if the backend database is unreachable/down
        if (credentials.userId === 'vedant-admin' && credentials.password === 'vedant123') {
          const demoUser = {
            _id: 'demo-user-id',
            userId: 'vedant-admin',
            name: 'Vedant Admin (Demo Mode)',
            role: 'admin',
          };
          localStorage.setItem('token', 'mock-token');
          localStorage.setItem('user', JSON.stringify(demoUser));
          set({
            token: 'mock-token',
            user: demoUser,
            isLoading: false,
            error: null,
          });
          toast.success('Database offline. Entered Local Demo Mode.');
          return true;
        }

        const castedErr = err as { response?: { data?: { message?: string } }; message?: string };
        const errMsg = castedErr.response?.data?.message || castedErr.message || 'An error occurred during login.';
        set({ isLoading: false, error: errMsg });
        return false;
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, error: null });
    },

    clearError: () => set({ error: null }),
  };
});
