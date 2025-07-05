'use client'

import { RequestSearchResult, RequestSearchParams } from '@/types/request';
import { PrintRequestResultsTable } from './PrintRequestResultsTable';

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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003594]"></div>
      </div>
    );
  }

  // Only show "Enter search terms" if no search has been performed
  if (!results && !searchParams.universal && !searchParams.equipmentNumber && !searchParams.partNumber) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium text-[#003594]">Welcome to Print Request</p>
        <p className="mt-2">Enter search terms to find requests</p>
      </div>
    );
  }

  // Show "No results found" if search was performed but returned empty array
  if (Array.isArray(results) && results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium text-[#003594]">No Results Found</p>
        <p className="mt-2">Try adjusting your search criteria</p>
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