'use client'

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface ItemDetails {
  id: number;
  name: string;
  equipmentNumber: string;
  partNumber: string;
  description?: string;
  location?: string;
  quantity?: number;
  // Add other fields as needed
}

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetails | null;
}

export const ItemDetailsModal = ({ isOpen, onClose, item }: ItemDetailsModalProps) => {
  if (!item) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Item Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{item.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Equipment Number</h4>
                    <p className="mt-1 text-sm text-gray-900">{item.equipmentNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Part Number</h4>
                    <p className="mt-1 text-sm text-gray-900">{item.partNumber}</p>
                  </div>
                  {item.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="mt-1 text-sm text-gray-900">{item.description}</p>
                    </div>
                  )}
                  {item.location && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Location</h4>
                      <p className="mt-1 text-sm text-gray-900">{item.location}</p>
                    </div>
                  )}
                  {item.quantity !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                      <p className="mt-1 text-sm text-gray-900">{item.quantity}</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 