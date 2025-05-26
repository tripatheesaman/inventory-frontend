'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { RequestItemForm } from '@/components/request/RequestItemForm';
import { RequestCart } from '@/components/request/RequestCart';
import { RequestPreviewModal } from '@/components/request/RequestPreviewModal';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/utils/utils';
import { use } from 'react';
import { useNotification } from '@/context/NotificationContext';

interface RequestCartItem {
  id: string;
  nacCode: string;
  partNumber: string;
  itemName: string;
  unit: string;
  requestQuantity: number;
  currentBalance: number;
  previousRate: number;
  equipmentNumber: string;
  imageUrl: string;
  specifications: string;
  remarks: string;
}

interface RequestDetails {
  requestNumber: string;
  requestDate: string;
  requestedBy: string;
  approvalStatus: string;
  items: RequestCartItem[];
}

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const notificationId = searchParams.get('notificationId');
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { markAsRead } = useNotification();
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cart, setCart] = useState<RequestCartItem[]>([]);
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await API.get(`/api/request/${resolvedParams.id}`);
        const data = response.data;
        // Transform the data to match RequestCartItem interface
        const transformedItems = data.items.map((item: any) => ({
          id: item.id.toString(),
          nacCode: item.nacCode || 'N/A',
          partNumber: item.partNumber,
          itemName: item.itemName,
          unit: item.unit,
          requestQuantity: item.requestedQuantity,
          currentBalance: item.currentBalance,
          previousRate: item.previousRate,
          equipmentNumber: item.equipmentNumber,
          imageUrl: item.imageUrl,
          specifications: item.specifications,
          remarks: item.remarks
        }));
        
        setRequestDetails({
          ...data,
          items: transformedItems
        });
        setCart(transformedItems);
        setRemarks(data.items[0]?.remarks || '');
        setDate(new Date(data.requestDate));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching request details:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch request details",
          duration: 3000,
        });
        setIsLoading(false);
      }
    };

    fetchRequestDetails();
  }, [resolvedParams.id]);

  const handleUpdateCartItem = (itemId: string, updates: Partial<RequestCartItem>) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteCartItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePreviewSubmit = () => {
    setIsPreviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!date) {
      showErrorToast({
        title: "Error",
        message: "Please select a request date",
        duration: 3000,
      });
      return;
    }

    if (cart.length === 0) {
      showErrorToast({
        title: "Error",
        message: "Your cart is empty. Please add items before submitting.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        requestDate: date.toISOString(),
        requestNumber: requestDetails?.requestNumber,
        remarks,
        requestedBy: requestDetails?.requestedBy,
        items: cart.map(item => ({
          id: item.id,
          nacCode: item.nacCode,
          partNumber: item.partNumber,
          itemName: item.itemName,
          requestedQuantity: item.requestQuantity,
          equipmentNumber: item.equipmentNumber,
          approvalStatus: 'PENDING',
          specifications: item.specifications || '',
          imageUrl: item.imageUrl,
          unit: item.unit || ''
        }))
      };

      const response = await API.put(`/api/request/${resolvedParams.id}`, requestData);

      if (response.status === 200) {
        // Delete the notification if notificationId exists
        if (notificationId) {
          try {
            markAsRead(Number(notificationId));
            await API.delete(`/api/notification/delete/${notificationId}`);
            // Mark the notification as read in the UI
          } catch (notificationError) {
            console.error('Error deleting notification:', notificationError);
            // Continue with success flow even if notification deletion fails
          }
        }

        showSuccessToast({
          title: "Success",
          message: "Request updated successfully",
          duration: 3000,
        });
        router.push('/dashboard');
      } else {
        throw new Error(response.data?.message || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update request",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#003594] border-t-transparent"></div>
          <p className="text-[#003594] font-medium">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!requestDetails) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-[#003594]">Request Not Found</div>
          <p className="text-gray-600">The request you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-[#003594] hover:bg-[#003594]/90 text-white"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 transition-all duration-200 hover:shadow-md">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
              Edit Request #{requestDetails.requestNumber}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <p>Requested by {requestDetails.requestedBy}</p>
              <span className="h-1 w-1 rounded-full bg-gray-400"></span>
              <p>Status: <span className="font-medium text-[#003594]">{requestDetails.approvalStatus}</span></p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-full md:w-[240px]">
              <Label className="text-[#003594] font-medium mb-2 block">Request Date</Label>
              <div className="relative">
              <Calendar
                value={date}
                onChange={(newDate: Date | null) => setDate(newDate ?? undefined)}
                className={cn(
                    "w-full rounded-lg border border-[#002a6e]/10 shadow-sm transition-all duration-200 hover:border-[#003594]/30",
                  !date && "text-muted-foreground"
                )}
              />
                {!date && (
                  <p className="text-sm text-gray-500 mt-2">Please select a date</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 transition-all duration-200 hover:shadow-md">
          <RequestCart
            items={cart}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            onRemoveItem={handleDeleteCartItem}
            onSubmit={handlePreviewSubmit}
            isSubmitDisabled={!date || cart.length === 0}
            isSubmitting={isSubmitting}
            remarks={remarks}
            onRemarksChange={setRemarks}
          />
          </div>
        </div>

        {date && (
          <RequestPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            onConfirm={handleConfirmSubmit}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            items={cart}
            date={date}
            requestNumber={requestDetails.requestNumber}
            remarks={remarks}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
} 