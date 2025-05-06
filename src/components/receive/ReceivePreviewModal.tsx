'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReceiveCartItem } from '@/types/receive';
import { format } from 'date-fns';

interface ReceivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateItem: (itemId: string, updates: Partial<ReceiveCartItem>) => void;
  onDeleteItem: (itemId: string) => void;
  items: ReceiveCartItem[];
  date: Date;
  remarks: string;
  isSubmitting: boolean;
}

export function ReceivePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onUpdateItem,
  onDeleteItem,
  items,
  date,
  remarks,
  isSubmitting,
}: ReceivePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Preview Receive</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Receive Date</h3>
            <p>{format(date, 'PPP')}</p>
          </div>
          <div>
            <h3 className="font-medium">Items</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="p-2 border rounded">
                  <p className="font-medium">{item.itemName}</p>
                  <p>Quantity: {item.receiveQuantity}</p>
                  <p>Part Number: {item.partNumber}</p>
                  <p>Equipment Number: {item.equipmentNumber}</p>
                  <p>Location: {item.location}</p>
                  <p>Card Number: {item.cardNumber}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm Receive"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 