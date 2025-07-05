'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RequestCartItem } from '@/types/request';
import { SearchResult } from '@/types/search';
import { PartNumberSelect } from './PartNumberSelect';
import { EquipmentRangeSelect } from './EquipmentRangeSelect';
import { Loader2 } from 'lucide-react';
import { expandEquipmentNumbers } from '@/utils/equipmentNumbers';
import imageCompression from 'browser-image-compression';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!isManualEntry && !item) return;

    setIsSubmitting(true);
    try {
      // Expand equipment numbers only for manual entry
      const finalEquipmentNumber = isManualEntry 
        ? Array.from(expandEquipmentNumbers(equipmentNumber)).join(',')
        : equipmentNumber;

    const cartItem: RequestCartItem = {
      id: isManualEntry ? 'N/A' : (item?.id?.toString() || 'N/A'),
      nacCode: isManualEntry ? 'N/A' : (item?.nacCode || 'N/A'),
      itemName: itemName,
      requestQuantity,
      partNumber: partNumber || 'N/A',
        equipmentNumber: finalEquipmentNumber,
      specifications: specifications || '',
      image: image || undefined,
      unit: isManualEntry ? unit : (item?.unit || ''),
    };

      await onSubmit(cartItem);
    resetForm();
    } finally {
      setIsSubmitting(false);
    }
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      try {
        const options = {
          maxWidthOrHeight: 1200,
          maxSizeMB: 1,
          useWebWorker: true,
          initialQuality: 0.7,
        };
        const compressedFile = await imageCompression(file, options);
        setImage(compressedFile);
      } catch (err) {
        console.error('Image compression error:', err);
        setImage(file); // fallback to original if compression fails
      }
    } else {
      setImage(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white rounded-xl shadow-sm border border-[#002a6e]/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
            {isManualEntry ? 'Add New Item' : 'Add Item to Request'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isManualEntry ? 'Enter the details for the new item' : 'Review and modify item details before adding to request'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label className="text-sm font-medium text-[#003594]">Item Name</Label>
            <Input 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
                className={`mt-1 ${errors.itemName ? "border-red-500" : "border-[#002a6e]/10 focus:border-[#003594]"}`}
            />
            {errors.itemName && <p className="text-sm text-red-500">{errors.itemName}</p>}
          </div>
          <div className="space-y-2">
              <Label className="text-sm font-medium text-[#003594]">NAC Code</Label>
              <Input 
                value={isManualEntry ? 'N/A' : item?.nacCode || ''} 
                disabled 
                className="mt-1 bg-gray-50 border-[#002a6e]/10"
              />
          </div>
          <div className="space-y-2">
              <Label htmlFor="requestQuantity" className="text-sm font-medium text-[#003594]">Request Quantity</Label>
            <Input
              id="requestQuantity"
              type="number"
              min="1"
              value={requestQuantity}
              onChange={(e) => setRequestQuantity(Number(e.target.value))}
              required
                className="mt-1 border-[#002a6e]/10 focus:border-[#003594]"
            />
          </div>
          {isManualEntry && (
            <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium text-[#003594]">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Enter unit (e.g., pcs, kg, etc.)"
                  className={`mt-1 ${errors.unit ? "border-red-500" : "border-[#002a6e]/10 focus:border-[#003594]"}`}
              />
              {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
            </div>
          )}
          <div className="space-y-2">
              <Label htmlFor="partNumber" className="text-sm font-medium text-[#003594]">Part Number</Label>
              {isManualEntry ? (
                <Input
                  id="partNumber"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Enter part number"
                  className="mt-1 border-[#002a6e]/10 focus:border-[#003594]"
                />
              ) : (
            <PartNumberSelect
                  partNumberList={item?.partNumber || ""}
                value={partNumber}
              onChange={(value) => setPartNumber(value)}
              error={errors.partNumber}
              />
              )}
          </div>
          <div className="space-y-2">
              <Label htmlFor="equipmentNumber" className="text-sm font-medium text-[#003594]">Equipment Number</Label>
              {isManualEntry ? (
                <Input
                  id="equipmentNumber"
                  value={equipmentNumber}
                  onChange={(e) => setEquipmentNumber(e.target.value)}
                  placeholder="Enter equipment number (e.g., 1000-1024 or 1000,1001,1002)"
                  className={`mt-1 ${errors.equipmentNumber ? "border-red-500" : "border-[#002a6e]/10 focus:border-[#003594]"}`}
                />
              ) : (
            <EquipmentRangeSelect
                  equipmentList={item?.equipmentNumber || ""}
                value={equipmentNumber}
              onChange={(value) => setEquipmentNumber(value)}
              error={errors.equipmentNumber}
              />
              )}
              {errors.equipmentNumber && <p className="text-sm text-red-500">{errors.equipmentNumber}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specifications" className="text-sm font-medium text-[#003594]">Specifications</Label>
            <Textarea
              id="specifications"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="Enter any specifications or additional details"
              className="mt-1 border-[#002a6e]/10 focus:border-[#003594] min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-medium text-[#003594]">Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 border-[#002a6e]/10 focus:border-[#003594] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#003594] file:text-white hover:file:bg-[#d2293b] file:transition-colors"
            />
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-[#002a6e]/10 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#003594] hover:bg-[#d2293b] text-white transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 