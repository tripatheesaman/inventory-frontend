'use client'

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueCartItem } from '@/types/issue';
import { Spinner } from '@/components/ui/spinner';

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

  if (totalItems === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Issue Cart ({totalItems} items)</h2>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.itemName}</h3>
                <p className="text-sm text-gray-500">NAC Code: {item.nacCode}</p>
                <p className="text-sm text-gray-500">Part Number: {item.partNumber}</p>
                <p className="text-sm text-gray-500">Equipment: {item.equipmentNumber}</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  className="w-16 px-2 py-1 border rounded"
                />
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" variant="white" className="mr-2" />
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