'use client'

import { SearchResult, ReceiveSearchResult } from '@/types/search';

interface SearchResultsProps {
  results: (SearchResult | ReceiveSearchResult)[] | null;
  isLoading: boolean;
  error: string | null;
  onRowDoubleClick: (item: SearchResult | ReceiveSearchResult) => void;
  canViewFullDetails: boolean;
}

export const SearchResults = ({ 
  results,
  isLoading,
  error,
  onRowDoubleClick,
  canViewFullDetails 
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003594]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-[#d2293b]/20 rounded-lg p-4 text-[#d2293b] text-center">
        <p className="font-medium">Error loading results</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-gray-50 border border-[#002a6e]/10 rounded-lg p-8 text-center">
        <p className="text-gray-500">No items found matching your search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#002a6e]/10">
        <thead>
          <tr className="bg-[#003594]/5">
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
              NAC Code
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[120px]">
              Part Number
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider min-w-[200px]">
              Item Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
              Current Balance
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider min-w-[150px]">
              Equipment Number
            </th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
              Location
            </th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
              Card Number
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#002a6e]/10">
          {results.map((item) => (
            <tr
              key={item.id}
              onDoubleClick={() => canViewFullDetails && onRowDoubleClick(item)}
              className={`hover:bg-[#003594]/5 transition-colors group ${canViewFullDetails ? 'cursor-pointer' : ''}`}
            >
              <td className="px-4 py-4">
                <div className="text-sm font-medium text-[#003594] group-hover:text-[#d2293b] transition-colors">
                  {item.nacCode}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 break-words">
                  {item.partNumber}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 break-words">
                  {item.itemName}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-center font-medium text-[#003594] group-hover:text-[#d2293b] transition-colors">
                  {item.currentBalance}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 break-words">
                  {item.equipmentNumber}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 text-center break-words">
                  {item.location}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 text-center break-words">
                  {item.cardNumber}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 