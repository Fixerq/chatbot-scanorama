
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  error: string;
  setError: (error: string) => void;
  isLoading: boolean;
}

export interface AdminCheck {
  checkAdminStatus: (userId: string) => Promise<boolean>;
}

export interface LoginFormProps {
  error: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  error: string | null;
  isLoading: boolean;
}
