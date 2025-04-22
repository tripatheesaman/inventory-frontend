/*
File: src/app/layout.tsx
Purpose: Root layout that handles both authenticated and unauthenticated routes
*/

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import DashboardLayoutContent from '@/components/layout/DashboardLayoutContent';
import { AuthContextProvider } from '@/context/AuthContext/AuthContext';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'Inventory management system',
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthContextProvider>
          <DashboardLayoutContent>
            {children}
          </DashboardLayoutContent>
        </AuthContextProvider>
        <Toaster />
      </body>
    </html>
  );
}
