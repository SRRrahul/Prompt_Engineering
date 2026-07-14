import { createContext, useContext, useState, ReactNode } from 'react';

interface ExaminerUser {
  id: string;
  name: string;
  email: string;
  username: string;
  department?: string;
  examStatus: string;
}

interface ExaminerAuthContextType {
  user: ExaminerUser | null;
  token: string | null;
  login: (token: string, user: ExaminerUser) => void;
  logout: () => void;
  updateExamStatus: (status: string) => void;
}

const ExaminerAuthContext = createContext<ExaminerAuthContextType | null>(null);

export function ExaminerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('examiner_token'));
  const [user, setUser] = useState<ExaminerUser | null>(() => {
    const stored = localStorage.getItem('examiner_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (newToken: string, newUser: ExaminerUser) => {
    localStorage.setItem('examiner_token', newToken);
    localStorage.setItem('examiner_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('examiner_token');
    localStorage.removeItem('examiner_user');
    setToken(null);
    setUser(null);
  };

  const updateExamStatus = (status: string) => {
    if (user) {
      const updated = { ...user, examStatus: status };
      setUser(updated);
      localStorage.setItem('examiner_user', JSON.stringify(updated));
    }
  };

  return (
    <ExaminerAuthContext.Provider value={{ user, token, login, logout, updateExamStatus }}>
      {children}
    </ExaminerAuthContext.Provider>
  );
}

export function useExaminerAuth() {
  const ctx = useContext(ExaminerAuthContext);
  if (!ctx) throw new Error('useExaminerAuth must be inside ExaminerAuthProvider');
  return ctx;
}
