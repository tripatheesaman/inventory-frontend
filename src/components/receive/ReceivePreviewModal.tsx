'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReceiveCartItem } from '@/types/receive';
import { format } from 'date-fns';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { EquipmentSelect } from '../issue/EquipmentSelect';
import { Spinner } from '@/components/ui/spinner';

interface ReceivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateItem: (itemId: string, updates: Partial<ReceiveCartItem>) => void;
  onDeleteItem: (itemId: string) => void;
  items: ReceiveCartItem[];
  date: Date;
  receiveNumber: string;
  remarks: string;
  isSubmitting: boolean;
}

interface EditableRowProps {
  item: ReceiveCartItem;
  onUpdate: (updates: Partial<ReceiveCartItem>) => void;
  onDelete: (itemId: string) => void;
}

function EditableRow({ item, onUpdate, onDelete }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="border-b">
        <td className="px-4 py-2">{item.nacCode}</td>
        <td className="px-4 py-2">{item.itemName}</td>
        <td className="px-4 py-2">
          <Input
            type="number"
            min="1"
            value={editedItem.receiveQuantity}
            onChange={(e) =>
              setEditedItem({
                ...editedItem,
                receiveQuantity: Number(e.target.value),
              })
            }
            className="w-20"
          />
        </td>
        <td className="px-4 py-2">
          <Input
            value={editedItem.partNumber}
            onChange={(e) =>
              setEditedItem({ ...editedItem, partNumber: e.target.value })
            }
          />
        </td>
        <td className="px-4 py-2">
          <Input
            value={editedItem.supplierName}
            onChange={(e) =>
              setEditedItem({ ...editedItem, supplierName: e.target.value })
            }
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex space-x-1">
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-2">{item.nacCode}</td>
      <td className="px-4 py-2">{item.itemName}</td>
      <td className="px-4 py-2">{item.receiveQuantity}</td>
      <td className="px-4 py-2">{item.partNumber}</td>
      <td className="px-4 py-2">{item.supplierName}</td>
      <td className="px-4 py-2">
        <div className="flex space-x-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function ReceivePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onUpdateItem,
  onDeleteItem,
  items,
  date,
  receiveNumber,
  remarks,
  isSubmitting,
}: ReceivePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Receive</DialogTitle>
          <DialogDescription>
            Review the items before submitting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Receive Number</p>
              <p className="text-sm">{receiveNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm">{format(date, 'PPP')}</p>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left font-medium">NAC Code</th>
                    <th className="px-4 py-2 text-left font-medium">Item Name</th>
                    <th className="px-4 py-2 text-left font-medium">Quantity</th>
                    <th className="px-4 py-2 text-left font-medium">Part Number</th>
                    <th className="px-4 py-2 text-left font-medium">Supplier</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <EditableRow
                      key={item.id}
                      item={item}
                      onUpdate={(updates) => onUpdateItem(item.id, updates)}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {remarks && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Remarks:</h3>
              <p className="text-sm">{remarks}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" variant="white" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Confirm Submit'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 