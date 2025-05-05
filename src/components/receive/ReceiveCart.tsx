'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReceiveCartItem } from '@/types/receive';
import { Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ReceiveCartProps {
  items: ReceiveCartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<ReceiveCartItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
}

export function ReceiveCart({
  items,
  onRemoveItem,
  onUpdateItem,
  onDeleteItem,
  onSubmit,
  isSubmitDisabled,
  isSubmitting,
}: ReceiveCartProps) {
  const [editingItem, setEditingItem] = useState<ReceiveCartItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (item: ReceiveCartItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateItem(editingItem.id, {
      receiveQuantity: editingItem.receiveQuantity,
      partNumber: editingItem.partNumber,
      equipmentNumber: editingItem.equipmentNumber,
      location: editingItem.location,
      cardNumber: editingItem.cardNumber,
      image: editingItem.image,
      supplierName: editingItem.supplierName,
      invoiceNumber: editingItem.invoiceNumber,
      invoiceDate: editingItem.invoiceDate,
    });
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Receive Cart</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No items in cart</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{item.itemName}</p>
                <p className="text-sm text-muted-foreground">
                  NAC Code: {item.nacCode}
                </p>
                <p className="text-sm">
                  Receive Quantity: {item.receiveQuantity}
                </p>
                {item.partNumber && (
                  <p className="text-sm">Part Number: {item.partNumber}</p>
                )}
                <p className="text-sm">
                  Equipment Number: {item.equipmentNumber}
                </p>
                <p className="text-sm">
                  Location: {item.location}
                </p>
                <p className="text-sm">
                  Card Number: {item.cardNumber}
                </p>
                <p className="text-sm">
                  Supplier: {item.supplierName}
                </p>
                <p className="text-sm">
                  Invoice: {item.invoiceNumber}
                </p>
                {item.invoiceDate && (
                  <p className="text-sm">
                    Invoice Date: {format(item.invoiceDate, 'PPP')}
                  </p>
                )}
                {item.image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(item.image)}
                      alt="Item"
                      className="max-w-[200px] rounded-md"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Submitting..." : "Submit Receive"}
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={editingItem.itemName} disabled />
              </div>
              <div className="space-y-2">
                <Label>NAC Code</Label>
                <Input value={editingItem.nacCode} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiveQuantity">Receive Quantity</Label>
                <Input
                  id="receiveQuantity"
                  type="number"
                  min="1"
                  value={editingItem.receiveQuantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      receiveQuantity: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={editingItem.partNumber}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      partNumber: e.target.value,
                    })
                  }
                  placeholder="Enter part number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentNumber">Equipment Number</Label>
                <Input
                  id="equipmentNumber"
                  value={editingItem.equipmentNumber}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      equipmentNumber: e.target.value,
                    })
                  }
                  placeholder="Enter equipment number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingItem.location}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      location: e.target.value,
                    })
                  }
                  placeholder="Enter location"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={editingItem.cardNumber}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      cardNumber: e.target.value,
                    })
                  }
                  placeholder="Enter card number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditingItem({
                        ...editingItem,
                        image: file,
                      });
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 