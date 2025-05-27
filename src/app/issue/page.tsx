/*
File: src/app/issue/page.tsx
Purpose: Issue Page
*/

'use client'

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { SearchControls, SearchResults } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { IssueCartItem, IssueRequest } from '@/types/issue';
import { IssueCart } from '@/components/issue/IssueCart';
import { IssueItemForm } from '@/components/issue/IssueItemForm';
import { IssuePreviewModal } from '@/components/issue/IssuePreviewModal';
import { API } from '@/lib/api';
import { SearchResult } from '@/types/search';
import { useAuthContext } from '@/context/AuthContext';
import { useCustomToast } from "@/components/ui/custom-toast";
import { startOfDay, format } from 'date-fns';

export default function IssuePage() {
  const { user } = useAuthContext();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cart, setCart] = useState<IssueCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
  } = useSearch();

  const handleRowDoubleClick = (item: SearchResult) => {
    setSelectedItem(item);
    setIsItemFormOpen(true);
  };

  const handleAddToCart = (item: IssueCartItem) => {
    const cartItem: IssueCartItem = {
      ...item,
      id: `${item.id}-${Date.now()}` // Generate unique ID by combining item ID and timestamp
    };
    setResults((prevResults: SearchResult[] | null) => 
      prevResults?.map(result => 
        result.id === Number(item.id)
          ? { ...result, currentBalance: (parseFloat(result.currentBalance) - item.issueQuantity).toString() }
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
      setResults((prevResults: SearchResult[] | null) => 
        prevResults?.map(result => 
          result.id === Number(removedItem.id)
            ? { ...result, currentBalance: (parseFloat(result.currentBalance) + removedItem.issueQuantity).toString() }
            : result
        ) ?? null
      );
    }
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePreviewSubmit = () => {
    setIsPreviewOpen(true);
  };

  const handleUpdateCartItem = (itemId: string, updates: Partial<IssueCartItem>) => {
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
            ? { ...result, currentBalance: (parseFloat(result.currentBalance) + deletedItem.issueQuantity).toString() }
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
        message: "You must be logged in to submit an issue request.",
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
      const selectedDate = date || new Date();
      const formattedDate = format(startOfDay(selectedDate), 'yyyy-MM-dd');
      
      const request: IssueRequest = {
        issueDate: formattedDate,
        items: cart.map(item => ({
          nacCode: item.nacCode,
          quantity: item.issueQuantity,
          equipmentNumber: item.selectedEquipment,
          partNumber: item.partNumber || 'NA'
        })),
        issuedBy: {
          name: user.UserInfo.name,
          staffId: user.UserInfo.username
        }
      };

      const response = await API.post('/api/issue/create', request);

      if (response.status === 201) {
        showSuccessToast({
          title: "Success",
          message: "Issue request submitted successfully.",
          duration: 3000,
        });
        setCart([]);
        setDate(undefined);
        setIsPreviewOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to submit issue request');
      }
    } catch (error) {
      console.error('Error submitting issue request:', error);
      
      let errorMessage = "Failed to submit issue request";
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">Issue Items</h1>
              <p className="text-gray-600 mt-1">Issue items from inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d2293b] animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Issue</span>
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
                  <SearchResults
                    results={results}
                    isLoading={isLoading}
                    error={error}
                    onRowDoubleClick={handleRowDoubleClick}
                    searchParams={searchParams}
                    canViewFullDetails={true}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Issue Form and Cart */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#003594]">Issue Date</h2>
                    <div className="mt-2">
                      <Calendar
                        value={date}
                        onChange={(newDate) => newDate && setDate(startOfDay(newDate))}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <IssueCart
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

      <IssueItemForm
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        item={selectedItem}
        onSubmit={handleAddToCart}
      />

      <IssuePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmSubmit}
        onUpdateItem={handleUpdateCartItem}
        onDeleteItem={handleDeleteCartItem}
        items={cart}
        date={date || new Date()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
  