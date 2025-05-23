'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IssueCartItem } from '@/types/issue';
import { Package, Hash, Scale, AlertCircle } from 'lucide-react';
import { PartNumberSelect } from '@/components/request/PartNumberSelect';
import { EquipmentRangeSelect } from '@/components/request/EquipmentRangeSelect';

interface IssueItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSubmit: (item: IssueCartItem) => void;
}

export function IssueItemForm({
  isOpen,
  onClose,
  item,
  onSubmit
}: IssueItemFormProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedPartNumber, setSelectedPartNumber] = useState('');
  const [errors, setErrors] = useState<{
    quantity?: string;
    equipment?: string;
    partNumber?: string;
  }>({});

  if (!item) return null;

  const validateForm = (): boolean => {
    const newErrors: { quantity?: string; equipment?: string; partNumber?: string } = {};

    // Validate quantity
    const quantityNum = parseFloat(quantity);
    if (!quantity || isNaN(quantityNum)) {
      newErrors.quantity = 'Please enter a valid quantity';
    } else if (quantityNum <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    } else if (quantityNum > item.currentBalance) {
      newErrors.quantity = 'Quantity cannot exceed current balance';
    }

    // Validate equipment
    if (!selectedEquipment) {
      newErrors.equipment = 'Please select an equipment';
    }

    // Validate part number
    if (!selectedPartNumber) {
      newErrors.partNumber = 'Please select a part number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSubmit({
      id: item.id,
      nacCode: item.nacCode,
      itemName: item.itemName,
      quantity: item.currentBalance,
      equipmentNumber: item.equipmentNumber,
      currentBalance: item.currentBalance,
      partNumber: selectedPartNumber,
      selectedEquipment,
      issueQuantity: parseFloat(quantity),
    });

    // Reset form
    setQuantity('');
    setSelectedEquipment('');
    setSelectedPartNumber('');
    setErrors({});
  };

  const hasPartNumber = item.partNumber && item.partNumber.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
            Add Item to Issue Cart
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Review and confirm item details before adding to cart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item Details Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-[#002a6e]/10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#003594]" />
                <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">NAC Code:</span>
                  <span className="ml-2 font-medium text-[#003594]">{item.nacCode}</span>
                </div>
                <div>
                  <span className="text-gray-500">Current Balance:</span>
                  <span className="ml-2 font-medium text-[#003594]">{item.currentBalance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-[#003594]">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Quantity
                </div>
              </Label>
              <div className="relative">
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
                  className={`${errors.quantity ? "border-red-500 focus-visible:ring-red-500" : "border-[#002a6e]/10 focus-visible:ring-[#003594]"}`}
                  placeholder="Enter quantity"
            />
            {errors.quantity && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
            )}
          </div>
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.quantity}
                </p>
            )}
          </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber" className="text-sm font-medium text-[#003594]">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Part Number
                </div>
              </Label>
              <div className="relative">
            {hasPartNumber ? (
                  <PartNumberSelect
                    partNumberList={item.partNumber}
                value={selectedPartNumber}
                onChange={setSelectedPartNumber}
                error={errors.partNumber}
              />
            ) : (
              <Input
                id="partNumber"
                value="NA"
                disabled
                    className="bg-gray-100 border-[#002a6e]/10"
              />
            )}
              </div>
              {errors.partNumber && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.partNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment" className="text-sm font-medium text-[#003594]">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Equipment Number
                </div>
              </Label>
              <div className="relative">
                <EquipmentRangeSelect
                  equipmentList={item.equipmentNumber}
                  value={selectedEquipment}
                  onChange={setSelectedEquipment}
                  error={errors.equipment}
                />
              </div>
              {errors.equipment && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.equipment}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#002a6e]/10">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#002a6e]/10 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[#003594] hover:bg-[#d2293b] text-white transition-colors"
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 