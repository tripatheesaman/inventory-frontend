'use client'

import { SearchResult, ReceiveSearchResult } from '@/types/search';
import { Spinner } from '@/components/ui/spinner';

interface SearchResultsProps {
  results: (SearchResult | ReceiveSearchResult)[] | null;
  isLoading: boolean;
  error: string | null;
  onRowDoubleClick: (item: SearchResult | ReceiveSearchResult) => void;
  searchParams: {
    universal: string;
    equipmentNumber: string;
    partNumber: string;
  } | null;
}

export function SearchResults({
  results,
  isLoading,
  error,
  onRowDoubleClick,
  searchParams,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        {searchParams && (searchParams.universal || searchParams.equipmentNumber || searchParams.partNumber) ? 'No results found' : 'Enter search criteria to find items'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            {results.length > 0 && 'requestNumber' in results[0] ? (
              <>
                <th className="px-4 py-2 text-left font-medium">Request Number</th>
                <th className="px-4 py-2 text-left font-medium">Request Date</th>
                <th className="px-4 py-2 text-left font-medium">Item Name</th>
                <th className="px-4 py-2 text-left font-medium">Part Number</th>
                <th className="px-4 py-2 text-left font-medium">Requested Quantity</th>
                <th className="px-4 py-2 text-left font-medium">Unit</th>
                <th className="px-4 py-2 text-left font-medium">Equipment Number</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-left font-medium">NAC Code</th>
                <th className="px-4 py-2 text-left font-medium">Item Name</th>
                <th className="px-4 py-2 text-left font-medium">Part Number</th>
                <th className="px-4 py-2 text-left font-medium">Equipment Number</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-left font-medium">Card Number</th>
                <th className="px-4 py-2 text-left font-medium">Current Balance</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 cursor-pointer"
              onDoubleClick={() => onRowDoubleClick(item)}
            >
              {'requestNumber' in item ? (
                <>
                  <td className="px-4 py-2">{item.requestNumber}</td>
                  <td className="px-4 py-2">{new Date(item.requestDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{item.itemName}</td>
                  <td className="px-4 py-2">{item.partNumber}</td>
                  <td className="px-4 py-2">{item.requestedQuantity}</td>
                  <td className="px-4 py-2">{item.unit}</td>
                  <td className="px-4 py-2">{item.equipmentNumber}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2">{item.nacCode}</td>
                  <td className="px-4 py-2">{item.itemName}</td>
                  <td className="px-4 py-2">{item.partNumber}</td>
                  <td className="px-4 py-2">{item.equipmentNumber}</td>
                  <td className="px-4 py-2">{item.location}</td>
                  <td className="px-4 py-2">{item.cardNumber}</td>
                  <td className="px-4 py-2">{item.currentBalance}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 