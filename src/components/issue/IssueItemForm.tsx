'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSelect } from './EquipmentSelect';
import { IssueCartItem } from '@/types/issue';

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

  // Check if item is consumable (contains 'consumable' in equipment number)
  const isConsumable = item.equipmentNumber.toLowerCase().includes('consumable');
  const hasPartNumber = item.partNumber && item.partNumber.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Item to Issue Cart</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">{item.itemName}</h3>
            <p className="text-sm text-gray-500">NAC Code: {item.nacCode}</p>
            <p className="text-sm text-gray-500">Current Balance: {item.currentBalance}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment">Equipment</Label>
            {isConsumable ? (
              <Input
                id="equipment"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                placeholder="Enter equipment number"
                className={errors.equipment ? "border-red-500" : ""}
              />
            ) : (
              <EquipmentSelect
                equipmentList={item.equipmentNumber}
                value={selectedEquipment}
                onChange={setSelectedEquipment}
                error={errors.equipment}
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partNumber">Part Number</Label>
            {hasPartNumber ? (
              <EquipmentSelect
                equipmentList={item.partNumber}
                value={selectedPartNumber}
                onChange={setSelectedPartNumber}
                error={errors.partNumber}
              />
            ) : (
              <Input
                id="partNumber"
                value="NA"
                disabled
                className="bg-gray-100"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 