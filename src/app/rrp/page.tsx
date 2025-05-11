'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { Loader2 } from 'lucide-react';

interface RRPConfig {
  rrpTypes: string[];
  suppliers: string[];
  currencies: string[];
}

export default function RRPPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<RRPConfig | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.UserInfo?.permissions?.includes('can_create_rrp')) {
        showErrorToast({
          title: "Access Denied",
          message: "You don't have permission to access this page",
          duration: 3000,
        });
        router.push('/dashboard');
        return;
      }

      try {
        const response = await API.get('/api/rrp/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Error fetching RRP config:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP configuration",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [user, router, showErrorToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Receiving Receipt System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push('/rrp/new?type=local')}
                className="w-full"
              >
                Create Local RRP
              </Button>
              <Button 
                onClick={() => router.push('/rrp/new?type=foreign')}
                className="w-full"
              >
                Create Foreign RRP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 