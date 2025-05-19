'use client'

import { useState, useCallback, useEffect } from 'react';
import { PrintRequestSearchControls } from '@/components/print/PrintRequestSearchControls';
import { PrintRequestResults } from '@/components/print/PrintRequestResults';
import { PrintRequestPreviewModal } from '@/components/print/PrintRequestPreviewModal';
import { RequestSearchParams, RequestSearchResult } from '@/types/request';
import { API } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

export default function PrintRequestPage() {
  const [searchParams, setSearchParams] = useState<RequestSearchParams>({
    universal: '',
    equipmentNumber: '',
    partNumber: '',
  });
  const [results, setResults] = useState<RequestSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRequest, setPreviewRequest] = useState<RequestSearchResult | null>(null);
  const { toast } = useToast();

  // Debounce the search parameters
  const debouncedUniversal = useDebounce(searchParams.universal, 300);
  const debouncedEquipment = useDebounce(searchParams.equipmentNumber, 300);
  const debouncedPart = useDebounce(searchParams.partNumber, 300);

  const searchRequests = useCallback(async (params: RequestSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get('/api/request/search', { params });
      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch requests. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to trigger search when debounced values change
  useEffect(() => {
    // Only search if at least one search parameter has a value
    if (debouncedUniversal || debouncedEquipment || debouncedPart) {
      const params = {
        universal: debouncedUniversal,
        equipmentNumber: debouncedEquipment,
        partNumber: debouncedPart,
      };
      searchRequests(params);
    } else {
      // Clear results when no search parameters
      setResults(null);
    }
  }, [debouncedUniversal, debouncedEquipment, debouncedPart, searchRequests]);

  const handleUniversalSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, universal: value }));
  };

  const handleEquipmentSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, equipmentNumber: value }));
  };

  const handlePartSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, partNumber: value }));
  };

  const handlePreview = (request: RequestSearchResult) => {
    setPreviewRequest(request);
  };

  const handlePrint = async (request: RequestSearchResult) => {
    try {
      const response = await API.get(`/api/request/${request.requestNumber}/print`, {
        responseType: 'blob'
      });

      // Create a blob URL
      const excelUrl = URL.createObjectURL(response.data);
      
      // Create download link for Excel file
      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = `request_${request.requestNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(excelUrl);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to generate Excel file. Please try again.',
        variant: 'destructive',
      });
      console.error('Print error:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Print Request</h1>
      
      <div className="mb-6">
        <PrintRequestSearchControls
          onUniversalSearch={handleUniversalSearch}
          onEquipmentSearch={handleEquipmentSearch}
          onPartSearch={handlePartSearch}
        />
      </div>

      <PrintRequestResults
        results={results}
        isLoading={isLoading}
        error={error}
        onPreview={handlePreview}
        onPrint={handlePrint}
        searchParams={searchParams}
      />

      <PrintRequestPreviewModal
        request={previewRequest}
        isOpen={!!previewRequest}
        onClose={() => setPreviewRequest(null)}
      />
    </div>
  );
} 