import { ReactNode } from "react"

export type UserInfo = {
    username: string
    name: string
    permissions: Record<string, any>
}

export type User = {
    UserInfo: UserInfo
    iat: number
    exp: number
}

export interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    permissions: string[]
    login: (username: string, password: string) => Promise<void>
    logout: () => void
}

export interface AuthContextProviderProps {
    children: ReactNode
}
