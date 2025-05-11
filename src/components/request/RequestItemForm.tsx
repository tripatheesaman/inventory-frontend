'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RequestCartItem } from '@/types/request';
import { SearchResult } from '@/types/search';
import { PartNumberSelect } from './PartNumberSelect';
import { EquipmentRangeSelect } from './EquipmentRangeSelect';

interface RequestItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  item: SearchResult | null;
  onSubmit: (item: RequestCartItem) => void;
  isManualEntry?: boolean;
}

export function RequestItemForm({ isOpen, onClose, item, onSubmit, isManualEntry = false }: RequestItemFormProps) {
  const [requestQuantity, setRequestQuantity] = useState<number>(1);
  const [partNumber, setPartNumber] = useState<string>('');
  const [equipmentNumber, setEquipmentNumber] = useState<string>('');
  const [specifications, setSpecifications] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Process item name to take only the first part if there's a comma
  const processItemName = (name: string) => {
    if (name.includes(',')) {
      return name.split(',')[0].trim();
    }
    return name;
  };

  // Initialize itemName when item changes
  useEffect(() => {
    if (item) {
      setItemName(processItemName(item.itemName));
      setUnit(item.unit || '');
    } else if (isManualEntry) {
      // Reset form for manual entry
      setItemName('');
      setRequestQuantity(1);
      setPartNumber('');
      setEquipmentNumber('');
      setSpecifications('');
      setImage(null);
      setUnit('');
      setErrors({});
    }
  }, [item, isManualEntry]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    
    if (!equipmentNumber.trim()) {
      newErrors.equipmentNumber = 'Equipment number is required';
    }
    
    if (isManualEntry && !unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // For selected item, we need the item to exist
    if (!isManualEntry && !item) return;

    const cartItem: RequestCartItem = {
      id: isManualEntry ? 'N/A' : (item?.id?.toString() || 'N/A'),
      nacCode: isManualEntry ? 'N/A' : (item?.nacCode || 'N/A'),
      itemName: itemName,
      requestQuantity,
      partNumber: partNumber || 'N/A',
      equipmentNumber,
      specifications: specifications || '',
      image: image || undefined,
      unit: isManualEntry ? unit : (item?.unit || ''),
    };

    onSubmit(cartItem);
    resetForm();
  };

  const resetForm = () => {
    setRequestQuantity(1);
    setPartNumber('');
    setEquipmentNumber('');
    setSpecifications('');
    setImage(null);
    setErrors({});
    if (item) {
      setItemName(processItemName(item.itemName));
      setUnit(item.unit || '');
    } else if (isManualEntry) {
      setItemName('');
      setUnit('');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Check if item has part numbers or equipment numbers with commas
  const hasPartNumbers = item?.partNumber && item.partNumber.includes(',');
  const hasEquipmentNumbers = item?.equipmentNumber && item.equipmentNumber.includes(',');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isManualEntry ? 'Add New Item' : 'Add Item to Request'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Input 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
              className={errors.itemName ? "border-red-500" : ""}
            />
            {errors.itemName && <p className="text-sm text-red-500">{errors.itemName}</p>}
          </div>
          <div className="space-y-2">
            <Label>NAC Code</Label>
            <Input value={isManualEntry ? 'N/A' : item?.nacCode || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestQuantity">Request Quantity</Label>
            <Input
              id="requestQuantity"
              type="number"
              min="1"
              value={requestQuantity}
              onChange={(e) => setRequestQuantity(Number(e.target.value))}
              required
            />
          </div>
          {isManualEntry && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Enter unit (e.g., pcs, kg, etc.)"
                className={errors.unit ? "border-red-500" : ""}
              />
              {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <PartNumberSelect
              partNumberList={hasPartNumbers ? item.partNumber : ""}
                value={partNumber}
              onChange={(value) => setPartNumber(value)}
              error={errors.partNumber}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipmentNumber">Equipment Number</Label>
            <EquipmentRangeSelect
              equipmentList={hasEquipmentNumbers ? item.equipmentNumber : ""}
                value={equipmentNumber}
              onChange={(value) => setEquipmentNumber(value)}
              error={errors.equipmentNumber}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications</Label>
            <Textarea
              id="specifications"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="Enter specifications"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImage(file);
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add to Cart</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 