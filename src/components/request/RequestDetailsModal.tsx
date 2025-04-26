import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    requestNumber: string;
    requestDate: string;
    requestedBy: string;
    items: {
      id: string;
      itemName: string;
      partNumber: string;
      equipmentNumber: string;
      requestQuantity: number;
    }[];
    status: string;
  };
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string, rejectionMessage: string) => void;
  onEdit?: (requestId: string, updatedData: any) => void;
  onDelete?: (requestId: string) => void;
}

export function RequestDetailsModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: RequestDetailsModalProps) {
  const [rejectionMessage, setRejectionMessage] = React.useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Request Details - {request.requestNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Request Date</p>
              <p>{new Date(request.requestDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Requested By</p>
              <p>{request.requestedBy}</p>
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Items</p>
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.partNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.equipmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.requestQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {onApprove && (
              <Button onClick={() => onApprove(request.id)} variant="default">
                Approve
              </Button>
            )}
            {onReject && (
              <Button onClick={() => onReject(request.id, rejectionMessage)} variant="destructive">
                Reject
              </Button>
            )}
            {onEdit && (
              <Button onClick={() => onEdit(request.id, {})} variant="outline">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button onClick={() => onDelete(request.id)} variant="destructive">
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 