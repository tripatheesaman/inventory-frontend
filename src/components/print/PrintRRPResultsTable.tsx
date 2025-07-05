'use client'

import { useState } from 'react';
import { cn } from '@/utils/utils';
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
  customsNumber: string | null;
  inspectionDetails: {
    inspection_user: string;
    inspection_details: Record<string, unknown>;
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
      <div className={cn("relative overflow-x-auto", className)}>
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-[#003594]/5 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">RRP Number</th>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">Date</th>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">Supplier</th>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">Type</th>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold text-[#003594]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageResults.map((rrp) => (
              <React.Fragment key={rrp.rrpNumber}>
                <tr
                  className="border-b border-[#002a6e]/10 hover:bg-[#003594]/5 transition-colors cursor-pointer"
                  onClick={() => toggleRow(rrp.rrpNumber)}
                >
                  <td className="px-6 py-4 font-medium flex items-center">
                    {expandedRows.has(rrp.rrpNumber) ? (
                      <ChevronUp className="h-4 w-4 mr-2 text-[#003594]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2 text-[#003594]" />
                    )}
                    {rrp.rrpNumber}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(rrp.rrpDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{rrp.supplierName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      rrp.type === 'local' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {rrp.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      rrp.approvalStatus === 'APPROVED' && "bg-green-100 text-green-800",
                      rrp.approvalStatus === 'PENDING' && "bg-yellow-100 text-yellow-800",
                      rrp.approvalStatus === 'REJECTED' && "bg-red-100 text-red-800"
                    )}>
                      {rrp.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#002a6e]/10 hover:bg-[#003594]/5 hover:text-[#003594]"
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
                          className="border-[#002a6e]/10 hover:bg-[#003594]/5 hover:text-[#003594]"
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
                  <tr className="bg-[#f8fafc]">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium text-[#003594]">Invoice Number</p>
                            <p className="text-sm">{rrp.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#003594]">Invoice Date</p>
                            <p className="text-sm">{new Date(rrp.invoiceDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                            <p className="text-sm font-medium text-[#003594]">Currency</p>
                            <p className="text-sm">{rrp.currency}</p>
                            </div>
                            <div>
                            <p className="text-sm font-medium text-[#003594]">Forex Rate</p>
                            <p className="text-sm">{rrp.forexRate}</p>
                            </div>
                            </div>
                        <div className="border-t border-[#002a6e]/10 pt-4">
                          <h4 className="text-sm font-medium text-[#003594] mb-2">Items</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-[#003594]/5">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-[#003594]">Item Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-[#003594]">Part Number</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-[#003594]">Quantity</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-[#003594]">Unit Price</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-[#003594]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rrp.items.map((item) => (
                                  <tr key={item.id} className="border-t border-[#002a6e]/10">
                                    <td className="px-4 py-2">{item.itemName}</td>
                              <td className="px-4 py-2">{item.partNumber}</td>
                              <td className="px-4 py-2">{item.receivedQuantity} {item.unit}</td>
                                    <td className="px-4 py-2">{item.itemPrice}</td>
                              <td className="px-4 py-2">{item.totalAmount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="border-[#002a6e]/10 hover:bg-[#003594]/5 hover:text-[#003594]"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="py-2 text-sm text-[#003594]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-[#002a6e]/10 hover:bg-[#003594]/5 hover:text-[#003594]"
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