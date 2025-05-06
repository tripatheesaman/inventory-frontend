/*
File: src/app/receive/page.tsx
Purpose: Receive Page
*/

'use client'

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { SearchControls, SearchResults } from '@/components/search';
import { useReceiveSearch } from '@/hooks/useReceiveSearch';
import { ReceiveCartItem, ReceiveData } from '@/types/receive';
import { ReceiveCart } from '@/components/receive/ReceiveCart';
import { ReceiveItemForm } from '@/components/receive/ReceiveItemForm';
import { ReceivePreviewModal } from '@/components/receive/ReceivePreviewModal';
import { API } from '@/lib/api';
import { ReceiveSearchResult } from '@/types/search';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useCustomToast } from "@/components/ui/custom-toast";
import { Label } from '@/components/ui/label';
import { SearchResult } from '@/types/search';

export default function ReceivePage() {
  const { user } = useAuthContext();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<ReceiveSearchResult | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cart, setCart] = useState<ReceiveCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
  } = useReceiveSearch();

  const handleRowDoubleClick = (item: SearchResult | ReceiveSearchResult) => {
    if ('requestedQuantity' in item) {
      setSelectedItem(item);
      setIsItemFormOpen(true);
    }
  };

  const handleItemSelect = (item: ReceiveSearchResult) => {
    setSelectedItem(item);
    setIsItemFormOpen(true);
  };

  const handleAddToCart = (item: ReceiveCartItem) => {
    // Check if cart already has 3 items
    if (cart.length >= 3) {
      showErrorToast({
        title: "Error",
        message: "Maximum of 3 items can be received at once.",
        duration: 3000,
      });
      return;
    }

    const cartItem: ReceiveCartItem = {
      ...item,
      id: `${item.id}-${Date.now()}` // Generate unique ID by combining item ID and timestamp
    };
    
    setResults((prevResults: ReceiveSearchResult[] | null) => 
      prevResults?.map(result => 
        result.id === Number(item.id)
          ? { ...result, currentBalance: String(Number(result.currentBalance) + item.receiveQuantity) }
          : result
      ) ?? null
    );
    
    setCart(prev => [...prev, cartItem]);
    setIsItemFormOpen(false);
    setSelectedItem(null);
  };

  const handleRemoveFromCart = (itemId: string) => {
    const removedItem = cart.find(item => item.id === itemId);
    if (removedItem) {
      setResults((prevResults: ReceiveSearchResult[] | null) => 
        prevResults?.map(result => 
          result.id === Number(removedItem.id)
            ? { ...result, currentBalance: String(Number(result.currentBalance) - removedItem.receiveQuantity) }
            : result
        ) ?? null
      );
    }
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePreviewSubmit = () => {
    setIsPreviewOpen(true);
  };

  const handleUpdateCartItem = (itemId: string, updates: Partial<ReceiveCartItem>) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteCartItem = (itemId: string) => {
    const deletedItem = cart.find(item => item.id === itemId);
    if (deletedItem) {
      setResults((prevResults: ReceiveSearchResult[] | null) => 
        prevResults?.map(result => 
          result.id === Number(deletedItem.id)
            ? { ...result, currentBalance: String(Number(result.currentBalance) - deletedItem.receiveQuantity) }
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
        message: "You must be logged in to submit a receive.",
        duration: 3000,
      });
      return;
    }

    if (!date) {
      showErrorToast({
        title: "Error",
        message: "Please select a receive date.",
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
            formData.append('folder', 'receive');
            
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

      // Prepare receive data
      const receiveData: ReceiveData = {
        receiveDate: date.toISOString(),
        remarks: '',
        receivedBy: user.UserInfo.username,
        items: cart.map((item, index) => ({
          nacCode: item.nacCode,
          partNumber: item.partNumber || 'NA',
          itemName: item.itemName,
          receiveQuantity: item.receiveQuantity,
          equipmentNumber: item.equipmentNumber,
          imagePath: imagePaths[index],
          unit: item.unit || '',
          requestId: Number(item.id.split('-')[0]), // Extract the original request ID from the combined ID
        }))
      };

      const response = await API.post('/api/receive', receiveData);

      if (response.status === 201) {
        showSuccessToast({
          title: "Success",
          message: "Items received successfully",
          duration: 3000,
        });

        // Reset form
        setCart([]);
        setDate(undefined);
        setResults(null);
      }
    } catch (error) {
      console.error('Error submitting receive:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to submit receive. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      setIsPreviewOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Receive Items</h1>

        <div className="grid gap-4 md:grid-cols-1">
          <div className="space-y-2">
            <Label>Receive Date</Label>
            <div className="grid gap-2">
              <Calendar
                value={date}
                onChange={(newDate) => setDate(newDate || undefined)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Search Items</h2>
          <SearchControls 
            onUniversalSearch={(value) => handleSearch('universal')(value)}
            onEquipmentSearch={(value) => handleSearch('equipmentNumber')(value)}
            onPartSearch={(value) => handleSearch('partNumber')(value)}
          />
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            onRowDoubleClick={handleRowDoubleClick}
            searchParams={searchParams}
          />
        </div>

        <div className="space-y-6">
          <ReceiveCart
            items={cart}
            onRemoveItem={handleRemoveFromCart}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            onSubmit={handlePreviewSubmit}
            isSubmitDisabled={!date || cart.length === 0}
            isSubmitting={isSubmitting}
          />
        </div>

        <ReceiveItemForm
          isOpen={isItemFormOpen}
          onClose={() => {
            setIsItemFormOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSubmit={handleAddToCart}
          isManualEntry={false}
        />

        {date && (
          <ReceivePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            onConfirm={handleConfirmSubmit}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            items={cart}
            date={date}
            remarks=""
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
  