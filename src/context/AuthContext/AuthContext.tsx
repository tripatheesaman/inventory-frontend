import { createContext, useEffect, useState } from "react"
import { AuthContextProviderProps, AuthContextType, User } from "./AuthContextTypes"
import { jwtDecode } from "jwt-decode"

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [permissions, setPermissions] = useState<string[]>([])

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded: User = jwtDecode(token);
            setUser(decoded);
            setIsAuthenticated(true)
            setPermissions(decoded.permissions)
        }
    }, []);

    const login = async (username: string, password: string) => {
        const data = await loginAPI(username, password);
        if (!data || !data.token) throw new Error("Invalid response from server");
        localStorage.setItem("token", data.token);
        const decoded = jwtDecode(data.token)
        setPermissions(decoded.permissions)
        setUser(decoded);
    };

    const logout = async () => {
        await logoutAPI();
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>)
} 