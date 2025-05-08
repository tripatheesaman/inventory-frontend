'use client'

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { SearchControls, SearchResults } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { RequestCartItem, RequestData } from '@/types/request';
import { RequestCart } from '@/components/request/RequestCart';
import { RequestItemForm } from '@/components/request/RequestItemForm';
import { RequestPreviewModal } from '@/components/request/RequestPreviewModal';
import { API } from '@/lib/api';
import { SearchResult } from '@/types/search';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useCustomToast } from "@/components/ui/custom-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { expandEquipmentNumbers } from '@/lib/utils/equipmentNumbers';

export default function RequestPage() {
  const { user } = useAuthContext();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [cart, setCart] = useState<RequestCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarks, setRemarks] = useState<string>('');

  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
    setSearchParams,
  } = useSearch();

  const handleRowDoubleClick = (item: SearchResult) => {
    setSelectedItem(item);
    setIsItemFormOpen(true);
  };

  const handleItemSelect = (item: SearchResult) => {
    setSelectedItem(item);
    setIsManualEntry(false);
    setIsItemFormOpen(true);
  };

  const handleManualEntry = () => {
    setSelectedItem(null);
    setIsManualEntry(true);
    setIsItemFormOpen(true);
  };

  const handleAddToCart = (item: RequestCartItem) => {
    // Check if cart already has 3 items
    if (cart.length >= 3) {
      showErrorToast({
        title: "Error",
        message: "Maximum of 3 items can be requested at once.",
        duration: 3000,
      });
      return;
    }

    const cartItem: RequestCartItem = {
      ...item,
      id: `${item.id}-${Date.now()}` // Generate unique ID by combining item ID and timestamp
    };
    
    setResults((prevResults: SearchResult[] | null) => 
      prevResults?.map(result => 
        result.id === Number(item.id)
          ? { ...result, currentBalance: (Number(result.currentBalance) - item.requestQuantity).toString() }
          : result
      ) ?? null
    );
    
    setCart(prev => [...prev, cartItem]);
    setIsItemFormOpen(false);
    setSelectedItem(null);
    setIsManualEntry(false);
  };

  const handleRemoveFromCart = (itemId: string) => {
    const removedItem = cart.find(item => item.id === itemId);
    if (removedItem) {
      setResults((prevResults: SearchResult[] | null) => 
        prevResults?.map(result => 
          result.id === Number(removedItem.id)
            ? { ...result, currentBalance: (Number(result.currentBalance) + removedItem.requestQuantity).toString() }
            : result
        ) ?? null
      );
    }
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePreviewSubmit = () => {
    setIsPreviewOpen(true);
  };

  const handleUpdateCartItem = (itemId: string, updates: Partial<RequestCartItem>) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteCartItem = (itemId: string) => {
    const deletedItem = cart.find(item => item.id === itemId);
    if (deletedItem) {
      setResults((prevResults: SearchResult[] | null) => 
        prevResults?.map(result => 
          result.id === Number(deletedItem.id)
            ? { ...result, currentBalance: (Number(result.currentBalance) + deletedItem.requestQuantity).toString() }
            : result
        ) ?? null
      );
    }
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleConfirmSubmit = async () => {
    if (!user) {
      showErrorToast({
        title: "Error",
        message: "You must be logged in to submit a request.",
        duration: 3000,
      });
      return;
    }

    if (!requestNumber.trim()) {
      showErrorToast({
        title: "Error",
        message: "Please enter a request number.",
        duration: 3000,
      });
      return;
    }

    if (!date) {
      showErrorToast({
        title: "Error",
        message: "Please select a request date.",
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
      // Upload images first
      const imagePaths: string[] = [];
      for (const item of cart) {
        if (item.image) {
          try {
            // Create a FormData object for the file upload
            const formData = new FormData();
            formData.append('file', item.image);
            formData.append('folder', 'request');
            
            // Upload the file using our API route
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(errorData.error || 'Failed to upload image');
            }
            
            const uploadResult = await uploadResponse.json();
            imagePaths.push(uploadResult.path);
          } catch (error) {
            console.error('Error uploading image:', error);
            showErrorToast({
              title: "Image Upload Error",
              message: `Failed to upload image for ${item.itemName}. Please try again.`,
              duration: 5000,
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          imagePaths.push('');
        }
      }

      // Prepare request data
      const requestData = {
        requestDate: date.toISOString(),
        requestNumber,
        remarks,
        requestedBy: user.UserInfo.username,
        items: cart.map((item, index) => ({
          nacCode: item.nacCode,
          partNumber: item.partNumber || 'NA',
          itemName: item.itemName,
          requestQuantity: item.requestQuantity,
          equipmentNumber: item.equipmentNumber,
          specifications: item.specifications || '',
          imagePath: imagePaths[index],
          unit: item.unit || ''
        }))
      };

      try {
        const response = await API.post('/api/request/create', requestData);

        if (response.status === 200 || response.status === 201) {
          showSuccessToast({
            title: "Success",
            message: "Request submitted successfully.",
            duration: 3000,
          });
          setCart([]);
          setDate(undefined);
          setRequestNumber('');
          setRemarks('');
          setIsPreviewOpen(false);
        } else {
          console.error('Unexpected response status:', response.status);
          throw new Error(response.data?.message || 'Failed to submit request');
        }
      } catch (apiError) {
        console.error('API error details:', apiError);
        if (apiError instanceof Error) {
          throw apiError;
        } else if (typeof apiError === 'object' && apiError !== null) {
          const axiosError = apiError as any;
          console.error('Axios error response:', axiosError.response);
          throw new Error(axiosError.response?.data?.message || 'Failed to submit request');
        } else {
          throw new Error('An unknown error occurred');
        }
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      
      let errorMessage = "Failed to submit request";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as any;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      showErrorToast({
        title: "Error",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Request Items</h1>
          <div className="flex flex-col gap-4">
            <div className="w-[200px]">
              <Button onClick={handleManualEntry} className="w-full">
                Request New Item
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="requestNumber">Request Number</Label>
                <Input
                  id="requestNumber"
                  value={requestNumber}
                  onChange={(e) => setRequestNumber(e.target.value)}
                  placeholder="Enter request number"
                  className="w-[200px]"
                />
              </div>
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
        </div>

        <div className="space-y-6">
          <SearchControls
            onUniversalSearch={handleSearch('universal')}
            onEquipmentSearch={handleSearch('equipmentNumber')}
            onPartSearch={handleSearch('partNumber')}
          />

          <div className="border rounded-lg">
            <SearchResults
              results={results}
              isLoading={isLoading}
              error={error}
              onRowDoubleClick={handleRowDoubleClick}
              searchParams={searchParams}
            />
          </div>
        </div>

        <div className="space-y-6">
          <RequestCart
            items={cart}
            onRemoveItem={handleRemoveFromCart}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            onSubmit={handlePreviewSubmit}
            isSubmitDisabled={!date || !requestNumber.trim() || cart.length === 0}
            isSubmitting={isSubmitting}
            remarks={remarks}
            onRemarksChange={setRemarks}
          />
        </div>

        <RequestItemForm
          isOpen={isItemFormOpen}
          onClose={() => {
            setIsItemFormOpen(false);
            setSelectedItem(null);
            setIsManualEntry(false);
          }}
          item={selectedItem}
          onSubmit={handleAddToCart}
          isManualEntry={isManualEntry}
        />

        {date && requestNumber && (
          <RequestPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            onConfirm={handleConfirmSubmit}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            items={cart}
            date={date}
            requestNumber={requestNumber}
            remarks={remarks}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
