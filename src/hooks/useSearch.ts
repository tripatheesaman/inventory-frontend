import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { API } from '@/lib/api';

interface SearchResult {
  id: number;
  name: string;
  equipmentNumber: string;
  partNumber: string;
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedUniversal = useDebounce(searchParams.universal, 300);
  const debouncedEquipmentNumber = useDebounce(searchParams.equipmentNumber, 300);
  const debouncedPartNumber = useDebounce(searchParams.partNumber, 300);

  const fetchSearchResults = useCallback(async () => {
    if (!debouncedUniversal && !debouncedEquipmentNumber && !debouncedPartNumber) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get('/api/search', {
        params: {
          universal: debouncedUniversal,
          equipmentNumber: debouncedEquipmentNumber,
          partNumber: debouncedPartNumber,
        }
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedUniversal, debouncedEquipmentNumber, debouncedPartNumber]);

  const handleSearch = (type: keyof SearchParams) => (value: string) => {
    setSearchParams(prev => ({ ...prev, [type]: value }));
  };

  return {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
    fetchSearchResults,
  };
}; 