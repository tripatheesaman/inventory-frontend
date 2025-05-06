'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { IMAGE_BASE_URL } from '@/constants/api';

interface PrintReceivePreviewModalProps {
  receive: {
    receiveNumber: string;
    receiveDate: string;
    receivedBy: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    items: {
      id: number;
      nacCode: string;
      partNumber: string;
      itemName: string;
      receiveQuantity: number;
      equipmentNumber: string;
      imageUrl: string;
      location: string;
      cardNumber: string;
      unit: string;
      remarks: string;
    }[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintReceivePreviewModal({ receive, isOpen, onClose }: PrintReceivePreviewModalProps) {
  if (!receive) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receive Preview - {receive.receiveNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receive Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Receive Date</p>
              <p>{format(new Date(receive.receiveDate), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Received By</p>
              <p>{receive.receivedBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                receive.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                receive.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {receive.approvalStatus}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 font-medium">Item Name</th>
                    <th className="text-left p-2 font-medium">Part Number</th>
                    <th className="text-left p-2 font-medium">Equipment Number</th>
                    <th className="text-left p-2 font-medium">Quantity</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-left p-2 font-medium">Card Number</th>
                    <th className="text-left p-2 font-medium">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {receive.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.itemName}</td>
                      <td className="p-2">{item.partNumber}</td>
                      <td className="p-2">{item.equipmentNumber}</td>
                      <td className="p-2">{item.receiveQuantity}</td>
                      <td className="p-2">{item.location}</td>
                      <td className="p-2">{item.cardNumber}</td>
                      <td className="p-2">
                        <img 
                          src={item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl.replace(/^\//, '')}`) : '/images/nepal_airlines_logo.png'}
                          alt={item.itemName}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/nepal_airlines_logo.png';
                          }}
                        />
                      </td>
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