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
import { cn } from '@/lib/utils';
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
  const [isEditOpen, setIsEditOpen] = useState(false);
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
    return <div>Loading...</div>;
  }

  if (!requestDetails) {
    return <div>Request not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Request #{requestDetails.requestNumber}</h1>
          <div className="flex items-center gap-4">
            <div className="w-[240px]">
              <Label>Request Date</Label>
              <Calendar
                value={date}
                onChange={(newDate: Date | null) => setDate(newDate ?? undefined)}
                className={cn(
                  "w-full rounded-md border shadow mt-2",
                  !date && "text-muted-foreground"
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
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