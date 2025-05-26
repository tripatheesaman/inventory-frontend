'use client'

import { useState, useEffect, Suspense, lazy } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { SearchControls } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { RequestCartItem, RequestData } from '@/types/request';
import { useAuthContext } from '@/context/AuthContext';
import { useCustomToast } from "@/components/ui/custom-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';
import { SearchResult } from '@/types/search';

// Lazy load heavy components
const SearchResults = lazy(() => import('@/components/search/SearchResults').then(module => ({ default: module.SearchResults })));
const RequestCart = lazy(() => import('@/components/request/RequestCart').then(module => ({ default: module.RequestCart })));
const RequestItemForm = lazy(() => import('@/components/request/RequestItemForm').then(module => ({ default: module.RequestItemForm })));
const RequestPreviewModal = lazy(() => import('@/components/request/RequestPreviewModal').then(module => ({ default: module.RequestPreviewModal })));

// Loading skeletons
const SearchResultsSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

const RequestCartSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

export default function RequestPage() {
  const { user, permissions } = useAuthContext();
  const canViewFullDetails = permissions.includes('can_view_full_item_details_in_search');
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
  const [isLoadingLastRequest, setIsLoadingLastRequest] = useState(true);

  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
    setSearchParams,
  } = useSearch();

  // Cache for last request info
  const [lastRequestCache, setLastRequestCache] = useState<{
    requestNumber: string;
    requestDate: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const fetchLastRequestInfo = async () => {
      // Check cache first
      if (lastRequestCache && Date.now() - lastRequestCache.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        setRequestNumber(lastRequestCache.requestNumber);
        if (lastRequestCache.requestDate) {
          setDate(new Date(lastRequestCache.requestDate));
        }
        setIsLoadingLastRequest(false);
        return;
      }

      try {
        const response = await API.get('/api/request/getlastrequestinfo');
        if (response.status === 200 && response.data) {
          const { requestNumber: lastRequestNumber, requestDate } = response.data;
          setRequestNumber(lastRequestNumber || '');
          if (requestDate) {
            setDate(new Date(requestDate));
          }
          // Update cache
          setLastRequestCache({
            requestNumber: lastRequestNumber || '',
            requestDate: requestDate || '',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error fetching last request info:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch last request information",
          duration: 3000,
        });
      } finally {
        setIsLoadingLastRequest(false);
      }
    };

    fetchLastRequestInfo();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">Create Request</h1>
              <p className="text-gray-600 mt-1">Request items from inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d2293b] animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Request</span>
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
                <Suspense fallback={<SearchResultsSkeleton />}>
                  {isLoading ? (
                    <SearchResultsSkeleton />
                  ) : (
                    <SearchResults
                      results={results}
                      isLoading={isLoading}
                      error={error}
                      onRowDoubleClick={handleRowDoubleClick}
                      searchParams={searchParams}
                      canViewFullDetails={canViewFullDetails}
                    />
                  )}
                </Suspense>
              </div>
            </div>

            {/* Right Column - Request Form and Cart */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="requestNumber" className="text-sm font-medium text-[#003594]">Request Number</Label>
                    <Input
                      id="requestNumber"
                      value={requestNumber}
                      onChange={(e) => setRequestNumber(e.target.value)}
                      className="mt-1"
                      placeholder="Enter request number"
                      disabled={isLoadingLastRequest}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#003594]">Request Date</Label>
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
                  <Button
                    onClick={handleManualEntry}
                    className="w-full bg-[#003594] hover:bg-[#d2293b] text-white transition-colors"
                  >
                    Request New Item
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
                <Suspense fallback={<RequestCartSkeleton />}>
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
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
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
      </Suspense>

      <Suspense fallback={null}>
        <RequestPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmSubmit}
          onUpdateItem={handleUpdateCartItem}
          onDeleteItem={handleDeleteCartItem}
          items={cart}
          date={date || new Date()}
          requestNumber={requestNumber}
          remarks={remarks}
          isSubmitting={isSubmitting}
        />
      </Suspense>
    </div>
  );
}
