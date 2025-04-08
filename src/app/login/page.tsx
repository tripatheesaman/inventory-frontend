'use client'
import { AuthContextProvider } from "@/context/AuthContext/AuthContext"
import LoginPage from "./components/loginForm"
const Home = () => {
  return (
    <>
      <AuthContextProvider>
        <LoginPage />
      </AuthContextProvider>
    </>
  )
}

export default Home