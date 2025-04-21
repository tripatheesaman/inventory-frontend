'use client'

import { Dialog } from '@headlessui/react';
import { X, Maximize2 } from 'lucide-react';
import { ItemDetails } from '@/types/item';
import Image from 'next/image';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetails | null;
}

export function ItemDetailsModal({ isOpen, onClose, item }: ItemDetailsModalProps) {
  if (!item) return null;

  const details = [
    { label: 'NAC Code', value: item.nacCode },
    { label: 'Item Name', value: item.itemName },
    { label: 'Part Number', value: item.partNumber },
    { label: 'Equipment Number', value: item.equipmentNumber },
    { label: 'Current Balance', value: `${item.currentBalance} ${item.unit}` },
    { label: 'Location', value: item.location },
    { label: 'Card Number', value: item.cardNumber },
    { label: 'Open Quantity', value: `${item.openQuantity} ${item.unit}` },
    { label: 'Open Amount', value: `NPR ${item.openAmount.toLocaleString()}` },
  ];

  const imageUrl = item.imageUrl || '/images/nepal_airlines_logo.png';
  const imageAlt = item.altText || 'Nepal Airlines Logo';

  const handleImageClick = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Item Details
              </h3>
              <button
                type="button"
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                <div 
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                  onClick={handleImageClick}
                >
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {details.map((detail, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">{detail.label}</p>
                      <p className="text-sm text-gray-900">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 