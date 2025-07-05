'use client'

import { useState, useCallback, useEffect } from 'react';
import { PrintRRPSearchControls } from '@/components/print/PrintRRPSearchControls';
import { PrintRRPResultsTable } from '@/components/print/PrintRRPResultsTable';
import { PrintRRPPreviewModal } from '@/components/print/PrintRRPPreviewModal';
import { API } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { expandEquipmentNumbers } from '@/utils/equipmentNumbers';

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
    inspection_details: Record<string, unknown>;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">Print RRP</h1>
        <p className="text-gray-600 mt-2">Search and print RRP documents</p>
      </div>
      
      <div className="mb-8 bg-white rounded-lg shadow-xl border-[#002a6e]/10 p-6">
        <PrintRRPSearchControls
          onUniversalSearch={handleUniversalSearch}
          onEquipmentSearch={handleEquipmentSearch}
          onPartSearch={handlePartSearch}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003594]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border-[#002a6e]/10 overflow-hidden">
        <PrintRRPResultsTable
          results={results || []}
          onPreview={handlePreview}
          onPrint={handlePrint}
        />
        </div>
      )}

      <PrintRRPPreviewModal
        rrp={previewRRP}
        isOpen={!!previewRRP}
        onClose={() => setPreviewRRP(null)}
      />
    </div>
  );
} 