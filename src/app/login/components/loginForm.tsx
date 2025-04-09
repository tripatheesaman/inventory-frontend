"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext/AuthContext";
import Image from "next/image";

const LoginPage = () => {
  const { login } = useAuthContext();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error("Login failed"));
      }
    }
  };

  return (
    <div className="flex bg-primary min-h-full flex-col justify-center px-0 py-0 lg:px-8">
      <Image
          className="mx-auto  h-70 w-auto sm:h-50"
          src="/images/nepal_airlines_logo.svg"
          alt="Your Company"
          width={640} 
          height={643} 
        />
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="bg-brand-light space-y-6" action="#" method="POST">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-700">Email address</label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-cyan-600 shadow-sm ring-1 ring-inset ring-red-500 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-black">Password</label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-red-500 hover:text-red-400">Forgot password?</a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-red-500 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default LoginPage;
