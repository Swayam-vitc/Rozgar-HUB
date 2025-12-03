import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole, WorkerProfile, EmployerProfile } from "@/types";
import { authAPI } from "@/lib/api";
import i18n from "@/lib/i18n";

interface AuthState {
  user: User | WorkerProfile | EmployerProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | WorkerProfile | EmployerProfile | null) => void;
  setRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const response = await authAPI.login({ email, password });

          if (response.success && response.token) {
            localStorage.setItem('rozgaar-token', response.token);

            // Set user's preferred language
            if (response.user?.language) {
              i18n.changeLanguage(response.user.language);
            }

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              loading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            loading: false
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ loading: true, error: null });
          const response = await authAPI.register(data);

          if (response.success && response.token) {
            localStorage.setItem('rozgaar-token', response.token);

            // Set user's preferred language
            if (response.user?.language) {
              i18n.changeLanguage(response.user.language);
            }

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              loading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            loading: false
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('rozgaar-token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          const token = localStorage.getItem('rozgaar-token');
          if (!token) return;

          set({ loading: true });
          const response = await authAPI.getMe();

          if (response.success) {
            // Set user's preferred language
            if (response.user?.language) {
              i18n.changeLanguage(response.user.language);
            }

            set({
              user: response.user,
              token,
              isAuthenticated: true,
              loading: false
            });
          }
        } catch (error) {
          set({ loading: false });
          get().logout();
        }
      }
    }),
    {
      name: "rozgaar-auth",
    }
  )
);
