'use client'

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface RRPSearchResult {
  rrpNumber: string;
  rrpDate: string;
  supplierName: string;
  type: 'local' | 'foreign';
  currency: string;
  forexRate: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string | null;
  airwayBillNumber: string | null;
  inspectionDetails: {
    inspection_user: string;
    inspection_details: Record<string, any>;
  };
  approvalStatus: string;
  createdBy: string;
  customsDate: string | null;
  items: Array<{
    id: number;
    itemName: string;
    partNumber: string;
    equipmentNumber: string;
    receivedQuantity: string;
    unit: string;
    itemPrice: string;
    customsCharge: string;
    customsServiceCharge: string;
    vatPercentage: string;
    freightCharge: string;
    totalAmount: string;
  }>;
}

interface PrintRRPResultsTableProps {
  results: RRPSearchResult[];
  onPreview: (rrp: RRPSearchResult) => void;
  onPrint: (rrp: RRPSearchResult) => void;
  className?: string;
}

const ITEMS_PER_PAGE = 10;

export const PrintRRPResultsTable = ({ 
  results = [], 
  onPreview,
  onPrint,
  className 
}: PrintRRPResultsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = (rrpNumber: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rrpNumber)) {
        newSet.delete(rrpNumber);
      } else {
        newSet.add(rrpNumber);
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
              <th scope="col" className="px-4 py-3">RRP Number</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Supplier</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageResults.map((rrp) => (
              <React.Fragment key={rrp.rrpNumber}>
                <tr
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRow(rrp.rrpNumber)}
                >
                  <td className="px-4 py-3 font-medium flex items-center">
                    {expandedRows.has(rrp.rrpNumber) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {rrp.rrpNumber}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(rrp.rrpDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{rrp.supplierName}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      rrp.type === 'local' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {rrp.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      rrp.approvalStatus === 'APPROVED' && "bg-green-100 text-green-800",
                      rrp.approvalStatus === 'PENDING' && "bg-yellow-100 text-yellow-800",
                      rrp.approvalStatus === 'REJECTED' && "bg-red-100 text-red-800"
                    )}>
                      {rrp.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(rrp);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {rrp.approvalStatus === 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(rrp);
                          }}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRows.has(rrp.rrpNumber) && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-3">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs uppercase text-gray-500">
                            <th className="px-4 py-2">Part Number</th>
                            <th className="px-4 py-2">Item Name</th>
                            <th className="px-4 py-2">Equipment Number</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Unit Price</th>
                            <th className="px-4 py-2">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rrp.items.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{item.partNumber}</td>
                              <td className="px-4 py-2">{item.itemName}</td>
                              <td className="px-4 py-2">{item.equipmentNumber}</td>
                              <td className="px-4 py-2">{item.receivedQuantity} {item.unit}</td>
                              <td className="px-4 py-2">
                                {rrp.type === 'foreign' 
                                  ? ((parseFloat(item.itemPrice) * parseFloat(rrp.forexRate)) / parseFloat(item.receivedQuantity)).toFixed(2)
                                  : (parseFloat(item.itemPrice) / parseFloat(item.receivedQuantity)).toFixed(2)}
                              </td>
                              <td className="px-4 py-2">{item.totalAmount}</td>
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
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="py-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}; 