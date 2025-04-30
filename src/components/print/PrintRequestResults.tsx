'use client'

import { RequestSearchResult, RequestSearchParams } from '@/types/request';
import { PrintRequestResultsTable } from './PrintRequestResultsTable';
import { Spinner } from '@/components/ui/spinner';

export interface PrintRequestResultsProps {
  results: RequestSearchResult[] | null;
  isLoading: boolean;
  error: string | null;
  onPreview: (request: RequestSearchResult) => void;
  onPrint: (request: RequestSearchResult) => void;
  searchParams: RequestSearchParams;
}

export function PrintRequestResults({
  results,
  isLoading,
  error,
  onPreview,
  onPrint,
  searchParams,
}: PrintRequestResultsProps) {
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

  // Only show "Enter search terms" if no search has been performed
  if (!results && !searchParams.universal && !searchParams.equipmentNumber && !searchParams.partNumber) {
    return (
      <div className="text-center py-8 text-gray-500">
        Enter search terms to find requests
      </div>
    );
  }

  // Show "No results found" if search was performed but returned empty array
  if (Array.isArray(results) && results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <PrintRequestResultsTable
        results={results}
        onPreview={onPreview}
        onPrint={onPrint}
      />
    );
  }

  return null;
} 