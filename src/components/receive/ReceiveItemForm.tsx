'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiveCartItem } from '@/types/receive';
import { SearchResult, ReceiveSearchResult } from '@/types/search';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';

interface ReceiveItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReceiveSearchResult | null;
  onSubmit: (item: ReceiveCartItem) => void;
  isManualEntry?: boolean;
}

export function ReceiveItemForm({ isOpen, onClose, item, onSubmit, isManualEntry = false }: ReceiveItemFormProps) {
  const { showErrorToast } = useCustomToast();
  const [receiveQuantity, setReceiveQuantity] = useState<number>(1);
  const [partNumber, setPartNumber] = useState('');
  const [equipmentNumber, setEquipmentNumber] = useState('');
  const [location, setLocation] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setItemName(processItemName(item.itemName));
      setUnit(item.unit || '');
      setPartNumber(item.partNumber || '');
      setEquipmentNumber(item.equipmentNumber || '');
      setLocation(item.location || '');
      setCardNumber(item.cardNumber || '');
    }
  }, [item]);

  const processItemName = (name: string): string => {
    return name.split(',')[0].trim();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }

    if (!partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }

    if (!equipmentNumber.trim()) {
      newErrors.equipmentNumber = 'Equipment number is required';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    }

    if (!image) {
      newErrors.image = 'Image is required';
    }

    if (receiveQuantity <= 0) {
      newErrors.receiveQuantity = 'Receive quantity must be greater than 0';
    } else if (item && receiveQuantity > item.requestedQuantity) {
      newErrors.receiveQuantity = `Receive quantity cannot be greater than requested quantity (${item.requestedQuantity})`;
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

    try {
      // Upload image first
      const formData = new FormData();
      formData.append('file', image!);
      formData.append('folder', 'receive');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const cartItem: ReceiveCartItem = {
        id: isManualEntry ? 'N/A' : (item?.id?.toString() || 'N/A'),
        nacCode: isManualEntry ? 'N/A' : (item?.nacCode || 'N/A'),
        itemName: itemName,
        receiveQuantity,
        partNumber,
        equipmentNumber,
        location,
        cardNumber,
        image: image || undefined,
        unit: isManualEntry ? unit : (item?.unit || ''),
        requestedQuantity: item?.requestedQuantity || 0,
        isLocationChanged: item?.location !== location,
        isCardNumberChanged: item?.cardNumber !== cardNumber,
      };

      onSubmit(cartItem);
      resetForm();
    } catch (error) {
      console.error('Error uploading image:', error);
      showErrorToast({
        title: "Image Upload Error",
        message: "Failed to upload image. Please try again.",
        duration: 5000,
      });
    }
  };

  const resetForm = () => {
    setReceiveQuantity(1);
    setPartNumber('');
    setEquipmentNumber('');
    setLocation('');
    setCardNumber('');
    setImage(null);
    setItemName('');
    setUnit('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isManualEntry ? 'Add New Item' : 'Add Item to Receive'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={!isManualEntry}
              className="bg-muted"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>NAC Code</Label>
            <Input
              value={isManualEntry ? 'N/A' : (item?.nacCode || 'N/A')}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiveQuantity">Receive Quantity</Label>
            <Input
              id="receiveQuantity"
              type="number"
              min="1"
              value={receiveQuantity}
              onChange={(e) => setReceiveQuantity(Number(e.target.value))}
              required
              className={errors.receiveQuantity ? "border-red-500" : ""}
            />
            {errors.receiveQuantity && <p className="text-sm text-red-500">{errors.receiveQuantity}</p>}
            {item?.requestedQuantity && (
              <p className="text-sm text-muted-foreground">
                Requested Quantity: {item.requestedQuantity}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <Input
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Enter part number"
              className={errors.partNumber ? "border-red-500" : ""}
              required
            />
            {errors.partNumber && <p className="text-sm text-red-500">{errors.partNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipmentNumber">Equipment Number</Label>
            <Input
              id="equipmentNumber"
              value={equipmentNumber}
              onChange={(e) => setEquipmentNumber(e.target.value)}
              placeholder="Enter equipment number"
              className={errors.equipmentNumber ? "border-red-500" : ""}
              required
            />
            {errors.equipmentNumber && <p className="text-sm text-red-500">{errors.equipmentNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              className={errors.location ? "border-red-500" : ""}
              required
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Enter card number"
              className={errors.cardNumber ? "border-red-500" : ""}
              required
            />
            {errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber}</p>}
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
                  setImage(file);
                }
              }}
              className={errors.image ? "border-red-500" : ""}
              required
            />
            {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
          </div>
          <DialogFooter>
            <Button type="submit">Add to Cart</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 