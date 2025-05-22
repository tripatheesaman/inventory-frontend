'use client'

import { Trash2, Package, Hash, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueCartItem } from '@/types/issue';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';

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
      <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-8 text-center hover:border-[#d2293b]/20 transition-colors">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Your cart is empty</p>
        <p className="text-sm text-gray-400 mt-1">Add items to your cart to proceed</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 hover:border-[#d2293b]/20 transition-colors">
      <div className="p-6 border-b border-[#002a6e]/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#003594]">Issue Cart</h2>
            <p className="text-sm text-gray-500 mt-1">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-[#003594]/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-[#003594]" />
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#002a6e]/10">
        {items.map((item) => (
          <div key={item.id} className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="font-medium text-gray-900">{item.itemName}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-[#003594]" />
                      <span className="text-gray-500">NAC Code:</span>
                      <span className="font-medium text-[#003594]">{item.nacCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-[#003594]" />
                      <span className="text-gray-500">Part Number:</span>
                      <span className="font-medium text-[#003594]">{item.partNumber || 'NA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-[#003594]" />
                      <span className="text-gray-500">Equipment:</span>
                      <span className="font-medium text-[#003594]">{item.selectedEquipment}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#003594]" />
                  <Input
                    type="number"
                    min="1"
                    value={item.issueQuantity}
                    onChange={(e) => onUpdateItem(item.id, { issueQuantity: parseFloat(e.target.value) || 1 })}
                    className="w-24 border-[#002a6e]/10 focus-visible:ring-[#003594]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteItem(item.id)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-[#002a6e]/10">
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled || isSubmitting}
          className="w-full bg-[#003594] hover:bg-[#d2293b] text-white transition-colors"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" variant="white" className="mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Issue Request'
          )}
        </Button>
      </div>
    </div>
  );
} 