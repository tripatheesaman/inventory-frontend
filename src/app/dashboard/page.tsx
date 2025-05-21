/*
File: src/app/dashboard/page.tsx
Purpose: Dashboard Home
*/

'use client';

import { useState, useEffect } from 'react';
import { PendingRequestsCount } from '@/components/dashboard/PendingRequestsCount';
import { PendingReceivesCount } from '@/components/dashboard/PendingReceivesCount';
import { PendingRRPCount } from '@/components/dashboard/PendingRRPCount';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#003594]">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#d2293b] animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Updates</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#003594] border-t-transparent"></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#003594] border-t-transparent"></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#003594] border-t-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#003594]">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d2293b] animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
              <PendingRequestsCount />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
              <PendingReceivesCount />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:shadow-md transition-shadow">
              <PendingRRPCount />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
