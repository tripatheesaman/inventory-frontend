/*
File: src/app/receive/page.tsx
Purpose: Receive Page
*/

'use client'

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { SearchControls } from '@/components/search';
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
import { ReceiveSearchResults } from '@/components/receive/ReceiveSearchResults';

export default function ReceivePage() {
  const { user, permissions } = useAuthContext();
  const canViewFullDetails = permissions.includes('can_view_full_item_details_in_search');
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<ReceiveSearchResult | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cart, setCart] = useState<ReceiveCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarks, setRemarks] = useState<string>('');
  const [isLoadingLastReceive, setIsLoadingLastReceive] = useState(true);

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
        remarks: remarks,
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
          location: item.isLocationChanged ? item.location : undefined,
          cardNumber: item.isCardNumberChanged ? item.cardNumber : undefined
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

  useEffect(() => {
    const fetchLastReceiveInfo = async () => {
      try {
        const response = await API.get('/api/receive/getlastreceiveinfo');
        if (response.status === 200 && response.data) {
          const { receiveDate } = response.data;
          if (receiveDate) {
            setDate(new Date(receiveDate));
          }
        }
      } catch (error) {
        console.error('Error fetching last receive info:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch last receive information",
          duration: 3000,
        });
      } finally {
        setIsLoadingLastReceive(false);
      }
    };

    fetchLastReceiveInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">Receive Items</h1>
              <p className="text-gray-600 mt-1">Receive items into inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d2293b] animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Receive</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Search and Results */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <SearchControls
                  onUniversalSearch={handleSearch('universal')}
                  onEquipmentSearch={handleSearch('equipmentNumber')}
                  onPartSearch={handleSearch('partNumber')}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                {isLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#003594] border-t-transparent"></div>
                  </div>
                ) : (
                  <ReceiveSearchResults
                    results={results}
                    isLoading={isLoading}
                    error={error}
                    onRowDoubleClick={handleRowDoubleClick}
                    searchParams={searchParams}
                    canViewFullDetails={canViewFullDetails}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Receive Form and Cart */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-[#003594]">Receive Date</Label>
                    <div className="mt-1">
                      <Calendar
                        value={date}
                        onChange={(newDate) => setDate(newDate ?? undefined)}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="remarks" className="text-sm font-medium text-[#003594]">Remarks</Label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                      placeholder="Enter any remarks"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
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
            </div>
          </div>
        </div>
      </div>

      <ReceiveItemForm
        isOpen={isItemFormOpen}
        onClose={() => {
          setIsItemFormOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSubmit={handleAddToCart}
      />

      <ReceivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmSubmit}
        onUpdateItem={handleUpdateCartItem}
        onDeleteItem={handleDeleteCartItem}
        items={cart}
        date={date || new Date()}
        remarks={remarks}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
  