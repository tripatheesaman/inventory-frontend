'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import RRPPreview from '@/components/rrp/RRPPreview';

interface CartItem {
  id: number;
  request_number: string;
  request_date: string;
  nac_code: string;
  item_name: string;
  part_number: string;
  equipment_number: string;
  quantity: number;
  unit: string;
  price: number;
  vat: boolean;
  customsCharge?: number;
}

export default function RRPPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await API.get('/api/rrp/cart');
        setCart(response.data);
      } catch (error) {
        console.error('Error fetching RRP cart:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP cart",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [showErrorToast]);

  const handleSubmit = async () => {
    try {
      await API.post('/api/rrp/submit');
      showErrorToast({
        title: "Success",
        message: "RRP submitted successfully",
        duration: 3000,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to submit RRP",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">RRP Preview</h1>
        </div>

        <RRPPreview
          cart={cart}
          rrpDate={searchParams.get('rrpDate') || new Date().toISOString()}
          supplier={searchParams.get('supplier') || ''}
          invoiceDate={searchParams.get('invoiceDate') || ''}
          invoiceNumber={searchParams.get('invoiceNumber') || ''}
          airwayBillNumber={searchParams.get('airwayBillNumber') || undefined}
          poNumber={searchParams.get('poNumber') || undefined}
          freightCharge={parseFloat(searchParams.get('freightCharge') || '0')}
          forexRate={parseFloat(searchParams.get('forexRate') || '1')}
          currency={searchParams.get('currency') || 'LKR'}
          onInvoiceDateChange={(date) => {
            if (date) {
              const params = new URLSearchParams(searchParams);
              params.set('invoiceDate', date.toISOString());
              router.push(`/rrp/preview?${params.toString()}`);
            }
          }}
          onInvoiceNumberChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set('invoiceNumber', value);
            router.push(`/rrp/preview?${params.toString()}`);
          }}
          onAirwayBillNumberChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set('airwayBillNumber', value);
            router.push(`/rrp/preview?${params.toString()}`);
          }}
          onPoNumberChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set('poNumber', value);
            router.push(`/rrp/preview?${params.toString()}`);
          }}
        />

        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit}>
            Submit RRP
          </Button>
        </div>
      </div>
    </div>
  );
} 