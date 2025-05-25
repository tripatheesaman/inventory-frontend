import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import UserPermissionsForm from './UserPermissionsForm';

export default function UserPermissionsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#003594]" />
      </div>
    }>
      <UserPermissionsForm userId={params.id} />
    </Suspense>
  );
} 