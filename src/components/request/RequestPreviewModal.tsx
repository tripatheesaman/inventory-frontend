'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequestCartItem } from '@/types/request';
import { format } from 'date-fns';
import { Pencil, Check, X, Trash2, Loader2 } from 'lucide-react';
import { EquipmentSelect } from '../issue/EquipmentSelect';
import { Spinner } from '@/components/ui/spinner';

interface RequestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateItem: (itemId: string, updates: Partial<RequestCartItem>) => void;
  onDeleteItem: (itemId: string) => void;
  items: RequestCartItem[];
  date: Date;
  requestNumber: string;
  remarks: string;
  isSubmitting: boolean;
}

interface EditableRowProps {
  item: RequestCartItem;
  onUpdate: (updates: Partial<RequestCartItem>) => void;
  onDelete: (itemId: string) => void;
}

function EditableRow({ item, onUpdate, onDelete }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const hasPartNumber = item.partNumber && item.partNumber.trim() !== '';

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
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2">{item.nacCode}</td>
        <td className="px-4 py-2">
          <Input
            value={editedItem.itemName}
            onChange={(e) => setEditedItem({ ...editedItem, itemName: e.target.value })}
            className="w-full"
          />
        </td>
        <td className="px-4 py-2">
          <EquipmentSelect
            equipmentList={item.equipmentNumber}
            value={editedItem.equipmentNumber}
            onChange={(value) => setEditedItem({ ...editedItem, equipmentNumber: value })}
          />
        </td>
        <td className="px-4 py-2">
          <Input
            type="number"
            value={editedItem.requestQuantity.toString()}
            onChange={(e) => setEditedItem({ ...editedItem, requestQuantity: parseFloat(e.target.value) })}
            className="w-24"
            min={1}
            step="0.01"
          />
        </td>
        <td className="px-4 py-2">
          {hasPartNumber ? (
            <EquipmentSelect
              equipmentList={item.partNumber || ''}
              value={editedItem.partNumber || ''}
              onChange={(value) => setEditedItem({ ...editedItem, partNumber: value })}
            />
          ) : (
            <Input
              value={editedItem.partNumber || ''}
              onChange={(e) => setEditedItem({ ...editedItem, partNumber: e.target.value })}
              placeholder="Enter part number"
              className="w-32"
            />
          )}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2">{item.nacCode}</td>
      <td className="px-4 py-2">{item.itemName}</td>
      <td className="px-4 py-2">{item.equipmentNumber}</td>
      <td className="px-4 py-2">{item.requestQuantity}</td>
      <td className="px-4 py-2">{item.partNumber || 'NA'}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function RequestPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onUpdateItem,
  onDeleteItem,
  items,
  date,
  requestNumber,
  remarks,
  isSubmitting,
}: RequestPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Request</DialogTitle>
          <DialogDescription>
            Review your request before submitting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Request Number: {requestNumber}
            </p>
            <p className="text-sm text-gray-500">
              Request Date: {format(date, 'PPP')}
            </p>
            <p className="text-sm text-gray-500">
              Total Items: {items.length}
            </p>
          </div>
          
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left font-medium">NAC Code</th>
                    <th className="px-4 py-2 text-left font-medium">Item Name</th>
                    <th className="px-4 py-2 text-left font-medium">Equipment</th>
                    <th className="px-4 py-2 text-left font-medium">Quantity</th>
                    <th className="px-4 py-2 text-left font-medium">Part Number</th>
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