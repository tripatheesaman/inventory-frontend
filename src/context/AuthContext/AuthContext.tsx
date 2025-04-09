import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContextProviderProps, AuthContextType, User } from "./AuthContextTypes";
import { loginRequest } from "@/app/login/loginrequest";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: User = jwtDecode<User>(token);
                setUser(decoded);
                setPermissions(decoded.permissions);
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem("token");
            }
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const data = await loginRequest(username, password);
            localStorage.setItem("token", data.accessToken);
            const decoded: User = jwtDecode<User>(data.accessToken);
            setUser(decoded);
            setPermissions(decoded.permissions);
        } catch (error:unknown) {
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
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, permissions, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = ()=>{
    const authContext = useContext(AuthContext)
    if (authContext === undefined) throw new Error("useFormContext must be used within FormContextProvider !")
    return authContext
}

