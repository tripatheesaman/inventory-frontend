'use client'

import { SearchResultsTable } from './SearchResultsTable';

export interface SearchResult {
  id: number;
  nacCode: string;
  itemName: string;
  partNumber: string;
  equipmentNumber: string; 
  currentBalance: number;
  location: string;
  cardNumber: string;
  unit?: string;
}

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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