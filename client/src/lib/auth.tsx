import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  truthTokens: number;
  avatar?: string;
  bio?: string;
  ensAddress?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  ensAddress?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/login", { username, password });
      const data = await res.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      
      navigate("/");
    } catch (error) {
      console.error("Login failed", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/register", userData);
      const data = await res.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Registration failed", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider 
      value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
