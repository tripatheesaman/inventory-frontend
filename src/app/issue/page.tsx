/*
File: src/app/issue/page.tsx
Purpose: Issue Page
*/

'use client'

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { SearchControls, SearchResults } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { IssueCartItem, IssueRequest } from '@/types/issue';
import { IssueCart } from '@/components/issue/IssueCart';
import { IssueItemForm } from '@/components/issue/IssueItemForm';
import { IssuePreviewModal } from '@/components/issue/IssuePreviewModal';
import { API } from '@/lib/api';
import { SearchResult } from '@/components/search/SearchResults';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useCustomToast } from "@/components/ui/custom-toast";

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
          ? { ...result, currentBalance: result.currentBalance - item.issueQuantity }
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
            ? { ...result, currentBalance: result.currentBalance + removedItem.issueQuantity }
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
            ? { ...result, currentBalance: result.currentBalance + deletedItem.issueQuantity }
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
      });
      return;
    }

    if (cart.length === 0) {
      showErrorToast({
        title: "Error",
        message: "Your cart is empty. Please add items before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const request: IssueRequest = {
        issueDate: date?.toISOString() || new Date().toISOString(),
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

      const response = await API.post('/api/issues/create', request);

      if (response.status === 201) {
        showSuccessToast({
          title: "Success",
          message: "Issue request submitted successfully.",
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Issue Items</h1>
          <div className="w-[240px]">
            <Calendar
              value={date}
              onChange={(newDate: Date | null) => setDate(newDate ?? undefined)}
              className={cn(
                "w-full rounded-md border shadow",
                !date && "text-muted-foreground"
              )}
            />
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

        <IssueItemForm
          isOpen={isItemFormOpen}
          onClose={() => setIsItemFormOpen(false)}
          item={selectedItem}
          onSubmit={handleAddToCart}
        />

        {date && (
          <IssuePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            onConfirm={handleConfirmSubmit}
            onUpdateItem={handleUpdateCartItem}
            onDeleteItem={handleDeleteCartItem}
            items={cart}
            date={date}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
  