'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { API } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Fuel, Droplet } from 'lucide-react';

type FuelType = 'petrol' | 'diesel';

export default function FuelIssuePage() {
  const [selectedType, setSelectedType] = useState<FuelType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleTypeSelect = async (type: FuelType) => {
    try {
      setIsLoading(true);
      setSelectedType(type);
      
      // Fetch configuration for the selected fuel type
      const response = await API.get(`/api/fuel/config/${type}`);
      console.log(response.data);
      
      if (response.status === 200) {
        // Navigate to the issue form with the config
        router.push(`/fuels/issue/${type}`);
      }
    } catch (error) {
      console.error('Error fetching fuel config:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fuel configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#003594]">Fuel Issue</h1>
        <p className="text-gray-500 mt-1">Select the type of fuel to issue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button
              variant={selectedType === 'petrol' ? 'default' : 'outline'}
              className="w-full h-40 flex flex-col items-center justify-center gap-4 hover:bg-[#003594]/10"
              onClick={() => handleTypeSelect('petrol')}
              disabled={isLoading}
            >
              <Droplet className="h-12 w-12 text-[#003594]" />
              <span className="text-xl font-medium">Petrol</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button
              variant={selectedType === 'diesel' ? 'default' : 'outline'}
              className="w-full h-40 flex flex-col items-center justify-center gap-4 hover:bg-[#003594]/10"
              onClick={() => handleTypeSelect('diesel')}
              disabled={isLoading}
            >
              <Fuel className="h-12 w-12 text-[#003594]" />
              <span className="text-xl font-medium">Diesel</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 