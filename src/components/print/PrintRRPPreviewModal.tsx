'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RRPSearchResult {
  rrpNumber: string;
  rrpDate: string;
  supplierName: string;
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

interface PrintRRPPreviewModalProps {
  rrp: RRPSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintRRPPreviewModal = ({ rrp, isOpen, onClose }: PrintRRPPreviewModalProps) => {
  if (!rrp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>RRP Preview - {rrp.rrpNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* RRP Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Date</p>
              <p>{new Date(rrp.rrpDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Supplier</p>
              <p>{rrp.supplierName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Type</p>
              <p className={cn(
                "inline-block px-2 py-1 rounded-full text-xs font-medium",
                rrp.currency === 'NPR' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              )}>
                {rrp.currency === 'NPR' ? 'LOCAL' : 'FOREIGN'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className={cn(
                "inline-block px-2 py-1 rounded-full text-xs font-medium",
                rrp.approvalStatus === 'APPROVED' && "bg-green-100 text-green-800",
                rrp.approvalStatus === 'PENDING' && "bg-yellow-100 text-yellow-800",
                rrp.approvalStatus === 'REJECTED' && "bg-red-100 text-red-800"
              )}>
                {rrp.approvalStatus}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipment Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rrp.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{item.partNumber}</td>
                      <td className="px-4 py-2">{item.itemName}</td>
                      <td className="px-4 py-2">{item.equipmentNumber}</td>
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
      </DialogContent>
    </Dialog>
  );
}; 