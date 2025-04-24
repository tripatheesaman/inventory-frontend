'use client'
import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContextProviderProps, AuthContextType, User } from "./AuthContextTypes";
import { loginRequest } from "@/app/login/loginApiRequests/loginrequest";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";

// Static permissions for all users
// const STATIC_PERMISSIONS = [
//     'view_dashboard',
//     'search_items',
//     'issue_items',
//     'receive_items',
//     'view_reports',
//     'view_daily_reports',
//     'view_weekly_reports',
//     'view_monthly_reports',
//     'manage_inventory',
//     'view_users',
//     'manage_users'
// ];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const validateToken = (token: string): boolean => {
        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch (error) {
            return false;
        }
    };

    const refreshToken = async () => {
        try {
            const response = await API.post('/api/auth/refresh', {}, { withCredentials: true });
            if (response.data.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                const decoded: User = jwtDecode<User>(response.data.accessToken);
                setUser(decoded);
                setPermissions(decoded.UserInfo.permissions);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Token refresh failed", error);
            return false;
        }
    };

    const initializeAuth = async () => {
        const token = localStorage.getItem("token");
        if (token && validateToken(token)) {
            try {
                const decoded: User = jwtDecode<User>(token);
                setUser(decoded);
                setPermissions(decoded.UserInfo.permissions);
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem("token");
                router.push("/login");
            }
        } else if (token) {
            // Token exists but is expired, try to refresh it
            const refreshed = await refreshToken();
            if (!refreshed) {
                localStorage.removeItem("token");
                router.push("/login");
            }
        } else {
            localStorage.removeItem("token");
            router.push("/login");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        initializeAuth();
    }, []);

    // Set up a timer to refresh the token before it expires
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const decoded: any = jwtDecode(token);
            const expiresIn = decoded.exp - (Date.now() / 1000);
            // Refresh token 1 minute before it expires
            const refreshTime = (expiresIn - 60) * 1000;
            
            if (refreshTime > 0) {
                const timer = setTimeout(async () => {
                    await refreshToken();
                }, refreshTime);
                
                return () => clearTimeout(timer);
            }
        } catch (error) {
            console.error("Error setting up token refresh", error);
        }
    }, [user]);

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
        return <div>Loading...</div>;
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

