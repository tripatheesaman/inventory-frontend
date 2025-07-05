'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { API } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, X, Pencil, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
} from '@/components/ui/modal';
import { IMAGE_BASE_URL } from '@/constants/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/utils';
import { useCustomToast } from '@/components/ui/custom-toast';
import Image from 'next/image';

interface PendingReceive {
  id: number;
  nacCode: string;
  itemName: string;
  partNumber: string;
  receivedQuantity: number;
  equipmentNumber?: string;
  receiveDate: string;
}

interface ReceiveDetails {
  id: number;
  requestNumber: string;
  requestDate: string;
  receiveDate: string;
  itemName: string;
  requestedPartNumber: string;
  receivedPartNumber: string;
  requestedQuantity: number;
  receivedQuantity: number;
  equipmentNumber: string;
  unit: string;
  requestedImage: string;
  receivedImage: string;
  nacCode: string;
  location?: string;
  cardNumber?: string;
}

interface EditData {
  receivedQuantity: number;
  nacCode?: string;
}

const FALLBACK_IMAGE = '/images/nepal_airlines_logo.jpeg';

export function PendingReceivesCount() {
  const { permissions, user } = useAuthContext();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [pendingReceives, setPendingReceives] = useState<PendingReceive[]>([]);
  const [selectedReceive, setSelectedReceive] = useState<ReceiveDetails | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [nacCodeError, setNacCodeError] = useState<string>('');

  const fetchPendingCount = useCallback(async () => {
    if (!permissions?.includes('can_approve_receive')) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.get('/api/receive/pending');
      setPendingReceives(response.data);
      setPendingCount(response.data.length);
    } catch (error) {
      console.error('Error fetching pending receives:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const handleViewDetails = async (receiveId: number) => {
    try {
      const response = await API.get(`/api/receive/${receiveId}/details`);
      if (response.status === 200) {
        const receiveData: ReceiveDetails = {
          id: response.data.receiveId,
          requestNumber: response.data.requestNumber,
          requestDate: response.data.requestDate,
          receiveDate: response.data.receiveDate,
          itemName: response.data.itemName,
          requestedPartNumber: response.data.requestedPartNumber,
          receivedPartNumber: response.data.receivedPartNumber,
          requestedQuantity: response.data.requestedQuantity,
          receivedQuantity: Number(response.data.receivedQuantity),
          equipmentNumber: response.data.equipmentNumber,
          unit: response.data.unit,
          requestedImage: response.data.requestedImage,
          receivedImage: response.data.receivedImage,
          nacCode: response.data.nacCode,
          location: response.data.location,
          cardNumber: response.data.cardNumber
        };
        setSelectedReceive(receiveData);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching receive details:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to fetch receive details",
        duration: 3000,
      });
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl.startsWith('http') ? imageUrl : `${IMAGE_BASE_URL}${imageUrl.replace(/^\//, '')}`);
    setIsImagePreviewOpen(true);
  };

  const validateNacCode = (code: string): boolean => {
    const nacCodeRegex = /^(GT|TW|GS) \d{5}$/;
    return nacCodeRegex.test(code);
  };

  const handleEditClick = () => {
    if (!selectedReceive) return;
    
    setEditData({
      receivedQuantity: selectedReceive.receivedQuantity,
      nacCode: selectedReceive.nacCode === 'N/A' ? '' : selectedReceive.nacCode
    });
    setNacCodeError('');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editData || !selectedReceive) return;

    // Validate NAC Code if it's being edited
    if (selectedReceive.nacCode === 'N/A' && editData.nacCode) {
      if (!validateNacCode(editData.nacCode)) {
        setNacCodeError('NAC Code must be in format: GT 12345, TW 12345, or GS 12345');
        return;
      }
    }

    try {
      const response = await API.put(`/api/receive/${selectedReceive.id}/update`, {
        receivedQuantity: editData.receivedQuantity,
        nacCode: editData.nacCode
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Receive details updated successfully",
          duration: 3000,
        });
        setIsEditOpen(false);
        handleViewDetails(selectedReceive.id);
      } else {
        throw new Error(response.data?.message || 'Failed to update receive details');
      }
    } catch (error) {
      console.error('Error updating receive details:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update receive details",
        duration: 5000,
      });
    }
  };

  const handleRejectClick = () => {
    setIsRejectOpen(true);
  };

  const handleRejectReceive = async () => {
    if (!selectedReceive || !rejectionReason.trim()) {
      showErrorToast({
        title: "Error",
        message: "Please provide a reason for rejection",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await API.put(`/api/receive/${selectedReceive.id}/reject`, {
        rejectedBy: user?.UserInfo?.username,
        rejectionReason: rejectionReason.trim()
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Receive rejected successfully",
          duration: 3000,
        });

        // Refresh the pending receives count
        const pendingResponse = await API.get('/api/receive/pending');
        setPendingReceives(pendingResponse.data);
        setPendingCount(pendingResponse.data.length);
        setIsDetailsOpen(false);
        setIsRejectOpen(false);
        setRejectionReason('');
      } else {
        throw new Error(response.data?.message || 'Failed to reject receive');
      }
    } catch (error) {
      console.error('Error rejecting receive:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to reject receive",
        duration: 5000,
      });
    }
  };

  const handleApproveReceive = async () => {
    if (!selectedReceive) return;

    try {
      const response = await API.put(`/api/receive/${selectedReceive.id}/approve`);

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Receive approved successfully",
          duration: 3000,
        });

        // Refresh the pending receives count
        const pendingResponse = await API.get('/api/receive/pending');
        setPendingReceives(pendingResponse.data);
        setPendingCount(pendingResponse.data.length);
        setIsDetailsOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to approve receive');
      }
    } catch (error) {
      console.error('Error approving receive:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to approve receive",
        duration: 5000,
      });
    }
  };

  if (!permissions?.includes('can_approve_receive')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#003594] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Card className="cursor-pointer hover:bg-[#003594]/5 transition-colors border-[#002a6e]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-[#003594]">Pending Receives</CardTitle>
              <Package className="h-5 w-5 text-[#003594]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-3xl font-bold text-[#003594]">...</div>
              ) : (
                <div className="text-3xl font-bold text-[#003594]">{pendingCount ?? 0}</div>
              )}
              <p className="text-sm text-gray-500 mt-1">Items awaiting approval</p>
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
              Pending Receives
            </ModalTitle>
            <ModalDescription className="text-gray-600">
              Review and manage pending receives
            </ModalDescription>
          </ModalHeader>

          <div className="mt-6 space-y-4">
            {pendingReceives.map((receive) => (
              <div
                key={receive.id}
                className="rounded-lg border border-[#002a6e]/10 p-6 hover:bg-[#003594]/5 cursor-pointer transition-colors"
                onDoubleClick={() => handleViewDetails(receive.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">NAC Code</p>
                    <p className="text-base font-semibold text-gray-900">{receive.nacCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Item Name</p>
                    <p className="text-base font-semibold text-gray-900">{receive.itemName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Part Number</p>
                    <p className="text-base font-semibold text-gray-900">{receive.partNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Received Quantity</p>
                    <p className="text-base font-semibold text-gray-900">{receive.receivedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Equipment Number</p>
                    <p className="text-base font-semibold text-gray-900">{receive.equipmentNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Received Date</p>
                    <p className="text-base font-semibold text-gray-900">{new Date(receive.receiveDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Double-click to view full details
                </div>
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
                  Receive Details
                </ModalTitle>
                <ModalDescription className="mt-1 text-gray-600">
                  Request #{selectedReceive?.requestNumber}
                </ModalDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594]"
                  onClick={handleEditClick}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Quantity
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApproveReceive}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2 bg-[#d2293b] hover:bg-[#d2293b]/90"
                  onClick={handleRejectClick}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </ModalHeader>
          <div className="mt-6 space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#003594]/5 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#003594]">Request Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedReceive?.requestDate && new Date(selectedReceive.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#003594]">Receive Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedReceive?.receiveDate && new Date(selectedReceive.receiveDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#003594]">Equipment Number</p>
                <p className="text-base font-semibold text-gray-900">{selectedReceive?.equipmentNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Requested Details */}
              <div className="space-y-6 p-6 border border-[#002a6e]/10 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-[#003594]">Requested Details</h3>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Item Name</p>
                    <p className="text-base text-gray-900">{selectedReceive?.itemName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Part Number</p>
                    <p className="text-base text-gray-900">{selectedReceive?.requestedPartNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Quantity</p>
                    <p className="text-base text-gray-900">{selectedReceive?.requestedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Image</p>
                    <div className="mt-2">
                      <Image
                        src={selectedReceive?.requestedImage ? 
                          (selectedReceive.requestedImage.startsWith('http') ? 
                            selectedReceive.requestedImage : 
                            `${IMAGE_BASE_URL}${selectedReceive.requestedImage.replace(/^\//, '')}`) 
                          : FALLBACK_IMAGE}
                        alt="Requested Item"
                        width={160}
                        height={160}
                        className="w-40 h-40 object-cover rounded-lg border border-[#002a6e]/10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => selectedReceive?.requestedImage && handleImageClick(selectedReceive.requestedImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Received Details */}
              <div className="space-y-6 p-6 border border-[#002a6e]/10 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-[#003594]">Received Details</h3>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Part Number</p>
                    <p className="text-base text-gray-900">{selectedReceive?.receivedPartNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Quantity</p>
                    <p className="text-base text-gray-900">{selectedReceive?.receivedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Unit</p>
                    <p className="text-base text-gray-900">{selectedReceive?.unit}</p>
                  </div>
                  {selectedReceive?.location && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#003594]">Location</p>
                      <p className="text-base text-gray-900">{selectedReceive.location}</p>
                    </div>
                  )}
                  {selectedReceive?.cardNumber && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#003594]">Card Number</p>
                      <p className="text-base text-gray-900">{selectedReceive.cardNumber}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Image</p>
                    <div className="mt-2">
                      <Image
                        src={selectedReceive?.receivedImage ? 
                          (selectedReceive.receivedImage.startsWith('http') ? 
                            selectedReceive.receivedImage : 
                            `${IMAGE_BASE_URL}${selectedReceive.receivedImage.replace(/^\//, '')}`) 
                          : FALLBACK_IMAGE}
                        alt="Received Item"
                        width={160}
                        height={160}
                        className="w-40 h-40 object-cover rounded-lg border border-[#002a6e]/10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => selectedReceive?.receivedImage && handleImageClick(selectedReceive.receivedImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isEditOpen} onOpenChange={setIsEditOpen}>
        <ModalContent className="max-w-md bg-white rounded-lg shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Edit Receive Details</ModalTitle>
          </ModalHeader>
          <div className="p-6 space-y-6">
            {selectedReceive?.nacCode === 'N/A' && (
              <div className="space-y-2">
                <Label htmlFor="nacCode" className="text-[#003594]">NAC Code</Label>
                <Input
                  id="nacCode"
                  value={editData?.nacCode || ''}
                  onChange={(e) => {
                    setEditData(prev => prev ? { ...prev, nacCode: e.target.value } : null);
                    setNacCodeError('');
                  }}
                  placeholder="Enter NAC Code (e.g., GT 12345)"
                  className={cn(
                    "border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20",
                    nacCodeError && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {nacCodeError && (
                  <p className="text-sm text-red-500">{nacCodeError}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="receivedQuantity" className="text-[#003594]">Received Quantity</Label>
              <Input
                id="receivedQuantity"
                type="number"
                value={editData?.receivedQuantity || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, receivedQuantity: parseInt(e.target.value) || 0 } : null)}
                className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="bg-[#003594] hover:bg-[#003594]/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <ModalContent className="max-w-md bg-white rounded-lg shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Reject Receive</ModalTitle>
            <ModalDescription className="text-gray-600">
              Please provide a reason for rejecting this receive.
            </ModalDescription>
          </ModalHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-[#003594]">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection"
                className="min-h-[100px] border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectOpen(false);
                  setRejectionReason('');
                }}
                className="border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectReceive}
                disabled={!rejectionReason.trim()}
                className="bg-[#d2293b] hover:bg-[#d2293b]/90 disabled:opacity-50"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <ModalContent className="max-w-3xl bg-white rounded-lg shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Image Preview</ModalTitle>
          </ModalHeader>
          <div className="p-6 flex justify-center">
            <Image
              src={selectedImage || FALLBACK_IMAGE}
              alt="Preview"
              width={400}
              height={400}
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-[#002a6e]/10"
            />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
} 