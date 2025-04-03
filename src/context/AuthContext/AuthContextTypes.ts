import { ReactNode } from "react"

export type User = {
    username:string
    userId:number
    permissions:string[]

}
export interface AuthContextType{
    user:User | null
    isAuthenticated: boolean 
    loginAPI:(username:string, password:string)=>Promise<void>
    logout:()=>void
}

export interface AuthContextProviderProps{
    children:ReactNode
}
