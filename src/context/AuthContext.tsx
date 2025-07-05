'use client'
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContextProviderProps, AuthContextType, User } from "../types/AuthContextTypes";
import { loginRequest } from "@/lib/loginrequest";
import { useRouter } from "next/navigation";
import { FullPageSpinner } from "@/components/ui/spinner";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
    const router = useRouter();

    const validateToken = (token: string): boolean => {
        try {
            const decoded = jwtDecode<unknown>(token);
            if (
                typeof decoded === 'object' &&
                decoded !== null &&
                'exp' in decoded &&
                typeof (decoded as { exp?: unknown }).exp === 'number'
            ) {
                const currentTime = Date.now() / 1000;
                return (decoded as { exp: number }).exp > currentTime;
            }
            return false;
        } catch {
            return false;
        }
    };

    const initializeAuth = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (token && validateToken(token)) {
            try {
                const decoded: User = jwtDecode<User>(token);
                setUser(decoded);
                setPermissions(decoded.UserInfo.permissions);
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem("token");
                setShouldRedirect("/login");
            }
        } else {
            localStorage.removeItem("token");
            setShouldRedirect("/login");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Handle redirects separately to avoid router dependency issues
    useEffect(() => {
        if (shouldRedirect) {
            router.push(shouldRedirect);
            setShouldRedirect(null);
        }
    }, [shouldRedirect, router]);

    const login = async (username: string, password: string) => {
        try {
            const data = await loginRequest(username, password);
            localStorage.setItem("token", data.accessToken);
            const decoded: User = jwtDecode<User>(data.accessToken);
            setUser(decoded);
            setPermissions(decoded.UserInfo.permissions);
            router.push("/dashboard");
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Login error:", error.message);
                throw error;
            }
            console.error("Login error: An unknown error occurred");
            throw new Error("An unknown error occurred");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setPermissions([]);
        router.push("/login");
    };

    if (isLoading) {
        return <FullPageSpinner />;
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, permissions, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const authContext = useContext(AuthContext);
    if (authContext === undefined) {
        throw new Error("useAuthContext must be used within AuthContextProvider!");
    }
    return authContext;
};

