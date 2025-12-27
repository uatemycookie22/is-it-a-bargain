import { createContext, useContext, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name?: string; username?: string } | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextType = {
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      username: session.user.username ?? undefined,
    } : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
