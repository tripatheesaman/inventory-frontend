'use client'

import { useState, useCallback, useEffect } from 'react';
import { PrintRRPSearchControls } from '@/components/print/PrintRRPSearchControls';
import { PrintRRPResultsTable } from '@/components/print/PrintRRPResultsTable';
import { PrintRRPPreviewModal } from '@/components/print/PrintRRPPreviewModal';
import { API } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { expandEquipmentNumbers } from '@/lib/utils/equipmentNumbers';

interface RRPSearchParams {
  universal: string;
  equipmentNumber: string;
  partNumber: string;
}

interface RRPSearchResult {
  rrpNumber: string;
  rrpDate: string;
  supplierName: string;
  type: 'local' | 'foreign';
  currency: string;
  forexRate: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string | null;
  airwayBillNumber: string | null;
  customsNumber: string | null;
  inspectionDetails: {
    inspection_user: string;
    inspection_details: Record<string, any>;
  };
  approvalStatus: string;
  createdBy: string;
  customsDate: string | null;
  items: Array<{
    id: number;
    itemName: string;
    partNumber: string;
    equipmentNumber: string;
    receivedQuantity: string;
    unit: string;
    itemPrice: string;
    customsCharge: string;
    customsServiceCharge: string;
    vatPercentage: string;
    freightCharge: string;
    totalAmount: string;
  }>;
}

export default function PrintRRPPage() {
  const [searchParams, setSearchParams] = useState<RRPSearchParams>({
    universal: '',
    equipmentNumber: '',
    partNumber: '',
  });
  const [results, setResults] = useState<RRPSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRRP, setPreviewRRP] = useState<RRPSearchResult | null>(null);
  const { toast } = useToast();

  // Debounce the search parameters
  const debouncedUniversal = useDebounce(searchParams.universal, 300);
  const debouncedEquipment = useDebounce(searchParams.equipmentNumber, 300);
  const debouncedPart = useDebounce(searchParams.partNumber, 300);

  const searchRRPs = useCallback(async (params: RRPSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get('/api/rrp/search', { params });
      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch RRPs. Please try again.');
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
      searchRRPs(params);
    } else {
      // Clear results when no search parameters
      setResults(null);
    }
  }, [debouncedUniversal, debouncedEquipment, debouncedPart, searchRRPs]);

  const handleUniversalSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, universal: value }));
  };

  const handleEquipmentSearch = (value: string) => {
    // Expand equipment numbers for search
    const expandedEquipmentNumbers = value
      ? Array.from(expandEquipmentNumbers(value)).join(',')
      : '';
    setSearchParams(prev => ({ ...prev, equipmentNumber: expandedEquipmentNumbers }));
  };

  const handlePartSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, partNumber: value }));
  };

  const handlePreview = (rrp: RRPSearchResult) => {
    setPreviewRRP(rrp);
  };

  const handlePrint = async (rrp: RRPSearchResult) => {
    try {
      const response = await API.get(`/api/rrp/${rrp.rrpNumber}/print`, {
        responseType: 'blob'
      });

      // Create a blob URL
      const excelUrl = URL.createObjectURL(response.data);
      
      // Create download link for Excel file
      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = `rrp_${rrp.rrpNumber}.xlsx`;
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
      <h1 className="text-2xl font-bold mb-6">Print RRP</h1>
      
      <div className="mb-6">
        <PrintRRPSearchControls
          onUniversalSearch={handleUniversalSearch}
          onEquipmentSearch={handleEquipmentSearch}
          onPartSearch={handlePartSearch}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <PrintRRPResultsTable
          results={results || []}
          onPreview={handlePreview}
          onPrint={handlePrint}
        />
      )}

      <PrintRRPPreviewModal
        rrp={previewRRP}
        isOpen={!!previewRRP}
        onClose={() => setPreviewRRP(null)}
      />
    </div>
  );
} 