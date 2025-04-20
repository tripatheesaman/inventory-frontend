'use client'

import { useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: number;
  nacCode: string;
  itemName: string;
  partNumber: string;
  equipmentNumber: string;
  currentBalance: number;
  location: string;
  cardNumber: string;
}

interface SearchResultsTableProps {
  results: SearchResult[];
  onRowDoubleClick: (item: SearchResult) => void;
  className?: string;
}

export const SearchResultsTable = ({ 
  results, 
  onRowDoubleClick,
  className 
}: SearchResultsTableProps) => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const parentRef = useVirtualizer({
    count: results.length,
    getScrollElement: () => document.getElementById('table-container'),
    estimateSize: () => 50, 
    overscan: 5,
  });
  return (
    <div 
      id="table-container"
      className={cn("h-[600px] overflow-auto border rounded-lg", className)}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NAC Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Part Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applicable For
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Card Number
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {parentRef.getVirtualItems().map((virtualRow) => {
            const item = results[virtualRow.index];
            return (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-gray-50 cursor-pointer",
                  selectedRow === item.id && "bg-blue-50"
                )}
                onClick={() => setSelectedRow(item.id)}
                onDoubleClick={() => onRowDoubleClick(item)}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.nacCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.itemName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.partNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.equipmentNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.currentBalance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.cardNumber}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 