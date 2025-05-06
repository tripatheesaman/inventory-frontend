/*
File: src/app/dashboard/page.tsx
Purpose: Dashboard Home
*/

'use client';

import { PendingRequestsCount } from '@/components/dashboard/PendingRequestsCount';
import { PendingReceivesCount } from '@/components/dashboard/PendingReceivesCount';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PendingRequestsCount />
          <PendingReceivesCount />
        </div>
      </div>
    </div>
  );
}
