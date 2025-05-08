'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { API } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrintReceiveResultsTable } from '@/components/print/PrintReceiveResultsTable';
import { PrintReceivePreviewModal } from '@/components/print/PrintReceivePreviewModal';
import { useToast } from '@/components/ui/use-toast';
import { expandEquipmentNumbers } from '@/lib/utils/equipmentNumbers';

interface ReceiveSearchParams {
  universal?: string;
  equipmentNumber?: string;
  partNumber?: string;
}

interface ReceiveSearchResult {
  receiveNumber: string;
  receiveDate: string;
  receivedBy: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  items: {
    id: number;
    nacCode: string;
    partNumber: string;
    itemName: string;
    receiveQuantity: number;
    equipmentNumber: string;
    imageUrl: string;
    location: string;
    cardNumber: string;
    unit: string;
    remarks: string;
  }[];
}

export default function PrintReceivePage() {
  const [searchParams, setSearchParams] = useState<ReceiveSearchParams>({});
  const [results, setResults] = useState<ReceiveSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewReceive, setPreviewReceive] = useState<ReceiveSearchResult | null>(null);
  const itemsPerPage = 10;

  const debouncedUniversal = useDebounce(searchParams.universal, 500);
  const debouncedEquipment = useDebounce(searchParams.equipmentNumber, 500);
  const debouncedPart = useDebounce(searchParams.partNumber, 500);

  const { toast } = useToast();

  const searchReceives = async (params: ReceiveSearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get('/api/receive/search', { params });
      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search receives. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to search receives. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to trigger search when debounced values change
  useEffect(() => {
    // Only search if at least one search parameter has a value
    if (debouncedUniversal || debouncedEquipment || debouncedPart) {
      const params = {
        universal: debouncedUniversal,
        equipmentNumber: debouncedEquipment,
        partNumber: debouncedPart,
      };
      searchReceives(params);
    } else {
      // Clear results when no search parameters
      setResults(null);
    }
  }, [debouncedUniversal, debouncedEquipment, debouncedPart]);

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

  const handlePreview = (receive: ReceiveSearchResult) => {
    setPreviewReceive(receive);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Print Receives</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="universal">Universal Search</Label>
            <Input
              id="universal"
              placeholder="Search by any field..."
              value={searchParams.universal || ''}
              onChange={(e) => handleUniversalSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment Number</Label>
            <Input
              id="equipment"
              placeholder="Search by equipment number..."
              value={searchParams.equipmentNumber || ''}
              onChange={(e) => handleEquipmentSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="part">Part Number</Label>
            <Input
              id="part"
              placeholder="Search by part number..."
              value={searchParams.partNumber || ''}
              onChange={(e) => handlePartSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <PrintReceiveResultsTable
            results={results}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPreview={handlePreview}
          />
        </div>

        <PrintReceivePreviewModal
          receive={previewReceive}
          isOpen={!!previewReceive}
          onClose={() => setPreviewReceive(null)}
        />
      </div>
    </div>
  );
} 