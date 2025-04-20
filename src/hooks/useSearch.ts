import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { API } from '@/lib/api';

interface SearchResult {
  id: number;
  nacCode: string;
  itemName: string;
  partNumber: string;
  equipmentNumber: string; // Applicable For
  currentBalance: number;
  location: string;
  cardNumber: string;
}

interface SearchParams {
  universal: string;
  equipmentNumber: string;
  partNumber: string;
}

export const useSearch = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    universal: '',
    equipmentNumber: '',
    partNumber: '',
  });
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await API.get('/api/search', {
        params: currentParams
      });
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
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
  };
}; 