'use client';

import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useRRP } from '@/hooks/useRRP';
import { Loader2, Receipt, Globe } from 'lucide-react';

export default function RRPPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { showErrorToast } = useCustomToast();
  const { isLoading, config } = useRRP();

  const handleCreateRRP = (type: 'local' | 'foreign') => {
    if (!user?.UserInfo?.permissions?.includes('can_create_rrp')) {
      showErrorToast({
        title: "Access Denied",
        message: "You don't have permission to access this page",
        duration: 3000,
      });
      router.push('/dashboard');
      return;
    }
    console.log('Creating RRP of type:', type);
    router.push(`/rrp/new?type=${type}`);
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Receiving Receipt System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
              <Button 
                onClick={() => handleCreateRRP('local')}
                className="h-32 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Receipt className="h-8 w-8" />
                <span className="text-lg font-semibold">Create Local RRP</span>
              </Button>
              <Button 
                onClick={() => handleCreateRRP('foreign')}
                className="h-32 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Globe className="h-8 w-8" />
                <span className="text-lg font-semibold">Create Foreign RRP</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 