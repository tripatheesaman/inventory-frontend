'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import LoginPage from "../../components/login/loginForm"

const Home = () => {
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Prevent going back
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href);
    };

    // Cleanup
    return () => {
      window.onpopstate = null;
    };
  }, []);

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <LoginPage />
    </>
  )
}

export default Home