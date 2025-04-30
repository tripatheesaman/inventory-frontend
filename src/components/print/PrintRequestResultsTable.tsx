'use client'

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { RequestSearchResult } from '@/types/request';
import { Button } from '@/components/ui/button';
import React from 'react';

interface PrintRequestResultsTableProps {
  results: RequestSearchResult[];
  onPreview: (request: RequestSearchResult) => void;
  onPrint: (request: RequestSearchResult) => void;
  className?: string;
}

const ITEMS_PER_PAGE = 10;

export const PrintRequestResultsTable = ({ 
  results = [], 
  onPreview,
  onPrint,
  className 
}: PrintRequestResultsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Ensure results is an array
  const safeResults = Array.isArray(results) ? results : [];
  
  const totalPages = Math.ceil(safeResults.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageResults = safeResults.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleRow = (requestNumber: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestNumber)) {
        newSet.delete(requestNumber);
      } else {
        newSet.add(requestNumber);
      }
      return newSet;
    });
  };

  if (safeResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("relative overflow-x-auto border rounded-lg", className)}>
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-3">Request Number</th>
              <th scope="col" className="px-4 py-3">Request Date</th>
              <th scope="col" className="px-4 py-3">Requested By</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageResults.map((request) => (
              <React.Fragment key={request.requestNumber}>
                <tr
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRow(request.requestNumber)}
                >
                  <td className="px-4 py-3 font-medium flex items-center">
                    {expandedRows.has(request.requestNumber) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {request.requestNumber}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {request.requestedBy}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      request.approvalStatus === 'APPROVED' && "bg-green-100 text-green-800",
                      request.approvalStatus === 'PENDING' && "bg-yellow-100 text-yellow-800",
                      request.approvalStatus === 'REJECTED' && "bg-red-100 text-red-800"
                    )}>
                      {request.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(request);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {request.approvalStatus === 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(request);
                          }}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRows.has(request.requestNumber) && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-3">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs uppercase text-gray-500">
                            <th className="px-4 py-2">NAC Code</th>
                            <th className="px-4 py-2">Part Number</th>
                            <th className="px-4 py-2">Item Name</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Equipment Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {request.items.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{item.nacCode}</td>
                              <td className="px-4 py-2">{item.partNumber}</td>
                              <td className="px-4 py-2">{item.itemName}</td>
                              <td className="px-4 py-2">{item.requestedQuantity}</td>
                              <td className="px-4 py-2">{item.equipmentNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, safeResults.length)}</span> of{' '}
                <span className="font-medium">{safeResults.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 