// app/dashboard/page.tsx
'use client'

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const HomeContent = dynamic(() => import('@/components/pages/HomeContent'), {
  suspense: true,
});

const DashboardHome = () => {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
};

export default DashboardHome;
