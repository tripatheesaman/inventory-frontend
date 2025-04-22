'use client'

import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueCartItem } from '@/types/issue';

interface IssueCartProps {
  items: IssueCartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<IssueCartItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onSubmit: () => void;
  isSubmitDisabled?: boolean;
  isSubmitting?: boolean;
}

export function IssueCart({ 
  items, 
  onRemoveItem, 
  onUpdateItem,
  onDeleteItem,
  onSubmit,
  isSubmitDisabled = false,
  isSubmitting = false 
}: IssueCartProps) {
  const totalItems = items.length;

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Issue Cart</h2>
        <p className="text-sm text-gray-500">{totalItems} items</p>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{item.itemName}</p>
                <p className="text-sm text-gray-500">NAC Code: {item.nacCode}</p>
                <p className="text-sm text-gray-500">Issued For: {item.selectedEquipment}</p>
                <p className="text-sm text-gray-500">Part Number: {item.partNumber || 'NA'}</p>
                <p className="text-sm text-gray-500">Quantity: {item.issueQuantity}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove item</span>
              </Button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No items in cart
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Cart'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 