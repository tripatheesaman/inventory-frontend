'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RRPPreview {
  type: string;
  rrpDate: string;
  invoiceDate: string;
  customsDate?: string;
  supplier: string;
  invoiceNumber: string;
  poNumber?: string;
  airwayBillNumber?: string;
  freightCharge?: number;
  currency?: string;
  forexRate?: number;
  items: {
    partNumber: string;
    equipmentNumber: string;
    description: string;
    unit: string;
    price: number;
    quantity: number;
    vat: boolean;
    customsCharge?: number;
    total: number;
  }[];
  totalAmount: number;
}

export default function RRPPreviewPage() {
  const router = useRouter();
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<RRPPreview | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await API.get('/api/rrp/preview');
        setPreview(response.data);
      } catch (error) {
        console.error('Error fetching RRP preview:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP preview",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
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

  if (!preview) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>RRP Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Type:</span> {preview.type}</p>
                  <p><span className="font-medium">RRP Date:</span> {new Date(preview.rrpDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Invoice Date:</span> {new Date(preview.invoiceDate).toLocaleDateString()}</p>
                  {preview.customsDate && (
                    <p><span className="font-medium">Customs Date:</span> {new Date(preview.customsDate).toLocaleDateString()}</p>
                  )}
                  <p><span className="font-medium">Supplier:</span> {preview.supplier}</p>
                  <p><span className="font-medium">Invoice Number:</span> {preview.invoiceNumber}</p>
                </div>
              </div>
              {preview.type === 'foreign' && (
                <div>
                  <h3 className="font-semibold mb-2">Foreign Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">PO Number:</span> {preview.poNumber}</p>
                    <p><span className="font-medium">Airway Bill Number:</span> {preview.airwayBillNumber}</p>
                    <p><span className="font-medium">Freight Charge:</span> {preview.freightCharge}</p>
                    <p><span className="font-medium">Currency:</span> {preview.currency}</p>
                    <p><span className="font-medium">Forex Rate:</span> {preview.forexRate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>VAT</TableHead>
                    {preview.type === 'foreign' && <TableHead>Customs</TableHead>}
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.partNumber}</TableCell>
                      <TableCell>{item.equipmentNumber}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.vat ? 'Yes' : 'No'}</TableCell>
                      {preview.type === 'foreign' && (
                        <TableCell>{item.customsCharge || 0}</TableCell>
                      )}
                      <TableCell>{item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total Amount */}
            <div className="text-right">
              <p className="text-lg font-semibold">
                Total Amount: {preview.totalAmount}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={handleSubmit}>
                Submit RRP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 