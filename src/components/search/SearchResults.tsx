'use client'

import { SearchResult } from '../../types/search';
import { SearchResultsTable } from './SearchResultsTable';
import { Spinner } from '@/components/ui/spinner';

export interface SearchResultsProps {
  results: SearchResult[] | null;
  isLoading: boolean;
  error: string | null;
  onRowDoubleClick: (item: SearchResult) => void;
  searchParams: {
    universal: string;
    equipmentNumber: string;
    partNumber: string;
  };
}

export function SearchResults({
  results,
  isLoading,
  error,
  onRowDoubleClick,
  searchParams,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8 text-gray-500">
        Enter search terms to find items
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <SearchResultsTable
        results={results}
        onRowDoubleClick={onRowDoubleClick}
      />
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      {searchParams.universal || searchParams.equipmentNumber || searchParams.partNumber
        ? "No results found"
        : "Enter search terms to find items"}
    </div>
  );
} 