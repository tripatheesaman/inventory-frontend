import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { API } from '@/lib/api';
import { ReceiveSearchResult } from '@/types/search';

interface SearchParams {
  universal: string;
  equipmentNumber: string;
  partNumber: string;
}

export function useReceiveSearch() {
  const [results, setResults] = useState<ReceiveSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    universal: '',
    equipmentNumber: '',
    partNumber: '',
  });

  const debouncedUniversal = useDebounce(searchParams.universal, 500);
  const debouncedEquipmentNumber = useDebounce(searchParams.equipmentNumber, 500);
  const debouncedPartNumber = useDebounce(searchParams.partNumber, 500);

  // Keep track of the last search parameters to prevent duplicate requests
  const lastSearchParams = useRef({
    universal: '',
    equipmentNumber: '',
    partNumber: '',
  });

  const fetchSearchResults = useCallback(async () => {
    const currentParams = {
      universal: debouncedUniversal,
      equipmentNumber: debouncedEquipmentNumber,
      partNumber: debouncedPartNumber,
    };

    // Only proceed if the search parameters have actually changed
    if (
      currentParams.universal === lastSearchParams.current.universal &&
      currentParams.equipmentNumber === lastSearchParams.current.equipmentNumber &&
      currentParams.partNumber === lastSearchParams.current.partNumber
    ) {
      return;
    }

    // Update the last search parameters
    lastSearchParams.current = currentParams;

    if (!currentParams.universal && !currentParams.equipmentNumber && !currentParams.partNumber) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get('/api/receive/search/receivables', { params: currentParams });
      console.log(response.data);
      if (response.status === 200) {
        // Transform the response data to flatten the items array
        const transformedResults = response.data.flatMap((request: any) => 
          request.items.map((item: any) => ({
            ...item,
            requestNumber: request.requestNumber,
            requestDate: request.requestDate,
            requestedBy: request.requestedBy,
            approvalStatus: request.approvalStatus
          }))
        );
        setResults(transformedResults);
      } else {
        setError('Failed to fetch results');
        setResults(null);
      }
    } catch (err) {
      setError('An error occurred while searching');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedUniversal, debouncedEquipmentNumber, debouncedPartNumber]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  const handleSearch = (type: keyof SearchParams) => (value: string) => {
    setSearchParams(prev => ({ ...prev, [type]: value }));
  };

  return {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
  };
} 