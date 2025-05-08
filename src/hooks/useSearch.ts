import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { API } from '@/lib/api';
import { SearchResult } from '@/types/search';
import { expandEquipmentNumbers } from '@/lib/utils/equipmentNumbers';

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

  const handleSearch = useCallback((type: keyof SearchParams) => (value: string) => {
    if (type === 'equipmentNumber') {
      // Expand equipment numbers for search
      const expandedEquipmentNumbers = value
        ? Array.from(expandEquipmentNumbers(value)).join(',')
        : '';
      setSearchParams(prev => ({ ...prev, [type]: expandedEquipmentNumbers }));
    } else {
      setSearchParams(prev => ({ ...prev, [type]: value }));
    }
  }, []);

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
      // Expand equipment numbers for search
      const expandedEquipmentNumbers = currentParams.equipmentNumber
        ? Array.from(expandEquipmentNumbers(currentParams.equipmentNumber)).join(',')
        : '';

      const response = await API.get('/api/search', {
        params: {
          ...currentParams,
          equipmentNumber: expandedEquipmentNumbers
        }
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

  return {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    setResults,
    setSearchParams,
  };
}; 