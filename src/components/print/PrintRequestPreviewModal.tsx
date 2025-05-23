'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RequestSearchResult } from '@/types/request';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PrintRequestPreviewModalProps {
  request: RequestSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintRequestPreviewModal({ request, isOpen, onClose }: PrintRequestPreviewModalProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-lg shadow-xl border-[#002a6e]/10">
        <DialogHeader className="pb-4 border-b border-[#002a6e]/10">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
            Request Preview - {request.requestNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-[#003594]">Request Date</p>
              <p className="text-lg font-semibold">{format(new Date(request.requestDate), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#003594]">Requested By</p>
              <p className="text-lg font-semibold">{request.requestedBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#003594]">Status</p>
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                request.approvalStatus === 'APPROVED' && "bg-green-100 text-green-800",
                request.approvalStatus === 'PENDING' && "bg-yellow-100 text-yellow-800",
                request.approvalStatus === 'REJECTED' && "bg-red-100 text-red-800"
              )}>
                {request.approvalStatus}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#002a6e]/10 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#003594]/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#003594] uppercase tracking-wider">NAC Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#003594] uppercase tracking-wider">Part Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#003594] uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#003594] uppercase tracking-wider">Equipment Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#003594] uppercase tracking-wider">Quantity</th>
                </tr>
              </thead>
                <tbody>
                {request.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#002a6e]/10 hover:bg-[#003594]/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{item.nacCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.partNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.equipmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.requestedQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 