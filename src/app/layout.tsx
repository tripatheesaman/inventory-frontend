import type { Metadata } from "next";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext/AuthContext";


export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Manage your inventory efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
      </body>
    </html>
  )
}