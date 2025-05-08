'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { API } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, X, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
} from '@/components/ui/modal';
import { useRouter } from 'next/navigation';
import { IMAGE_BASE_URL } from '@/constants/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';

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

export function PendingReceivesCount() {
  const { permissions, user } = useAuthContext();
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [pendingCount, setPendingCount] = useState<number>(0);
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

  useEffect(() => {
    const fetchPendingCount = async () => {
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
    };

    fetchPendingCount();
  }, [permissions]);

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

  return (
    <>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Receives</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount === 0 ? 'No pending receives' : 'Receives awaiting approval'}
              </p>
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Pending Receives</ModalTitle>
            <ModalDescription>
              Review and manage pending receives
            </ModalDescription>
          </ModalHeader>

          <div className="mt-4 space-y-4">
            {pendingReceives.map((receive) => (
              <div
                key={receive.id}
                className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onDoubleClick={() => handleViewDetails(receive.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">NAC Code</p>
                    <p className="text-base font-semibold">{receive.nacCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Item Name</p>
                    <p className="text-base font-semibold">{receive.itemName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Part Number</p>
                    <p className="text-base font-semibold">{receive.partNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Received Quantity</p>
                    <p className="text-base font-semibold">{receive.receivedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Equipment Number</p>
                    <p className="text-base font-semibold">{receive.equipmentNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Received Date</p>
                    <p className="text-base font-semibold">{new Date(receive.receiveDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Double-click to view full details
                </div>
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <div className="flex justify-between items-center">
              <div>
                <ModalTitle>Receive Details</ModalTitle>
                <ModalDescription className="mt-1">
                  Request #{selectedReceive?.requestNumber}
                </ModalDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
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
                  className="flex items-center gap-2"
                  onClick={handleRejectClick}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </ModalHeader>
          <div className="mt-4 space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Request Date</p>
                <p className="text-base font-semibold">
                  {selectedReceive?.requestDate && new Date(selectedReceive.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Receive Date</p>
                <p className="text-base font-semibold">
                  {selectedReceive?.receiveDate && new Date(selectedReceive.receiveDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Equipment Number</p>
                <p className="text-base font-semibold">{selectedReceive?.equipmentNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Requested Details */}
              <div className="space-y-4 p-4 border rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Requested Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Item Name</p>
                    <p className="text-base">{selectedReceive?.itemName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Part Number</p>
                    <p className="text-base">{selectedReceive?.requestedPartNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Quantity</p>
                    <p className="text-base">{selectedReceive?.requestedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Image</p>
                    <div className="mt-2">
                      <img 
                        src={selectedReceive?.requestedImage ? (selectedReceive.requestedImage.startsWith('http') ? selectedReceive.requestedImage : `${IMAGE_BASE_URL}${selectedReceive.requestedImage.replace(/^\//, '')}`) : '/images/nepal_airlines_logo.png'}
                        alt="Requested Item"
                        className="w-40 h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => selectedReceive?.requestedImage && handleImageClick(selectedReceive.requestedImage)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/nepal_airlines_logo.png';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Received Details */}
              <div className="space-y-4 p-4 border rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Received Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Part Number</p>
                    <p className="text-base">{selectedReceive?.receivedPartNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Quantity</p>
                    <p className="text-base">{selectedReceive?.receivedQuantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Unit</p>
                    <p className="text-base">{selectedReceive?.unit}</p>
                  </div>
                  {selectedReceive?.location && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-base">{selectedReceive.location}</p>
                    </div>
                  )}
                  {selectedReceive?.cardNumber && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Card Number</p>
                      <p className="text-base">{selectedReceive.cardNumber}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Image</p>
                    <div className="mt-2">
                      <img 
                        src={selectedReceive?.receivedImage ? (selectedReceive.receivedImage.startsWith('http') ? selectedReceive.receivedImage : `${IMAGE_BASE_URL}${selectedReceive.receivedImage.replace(/^\//, '')}`) : '/images/nepal_airlines_logo.png'}
                        alt="Received Item"
                        className="w-40 h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => selectedReceive?.receivedImage && handleImageClick(selectedReceive.receivedImage)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/nepal_airlines_logo.png';
                        }}
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
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Receive Details</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            {selectedReceive?.nacCode === 'N/A' && (
              <div className="space-y-2">
                <Label htmlFor="nacCode">NAC Code</Label>
                <Input
                  id="nacCode"
                  value={editData?.nacCode || ''}
                  onChange={(e) => {
                    setEditData(prev => prev ? { ...prev, nacCode: e.target.value } : null);
                    setNacCodeError('');
                  }}
                  placeholder="Enter NAC Code (e.g., GT 12345)"
                  className={nacCodeError ? "border-red-500" : ""}
                />
                {nacCodeError && (
                  <p className="text-sm text-red-500">{nacCodeError}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="receivedQuantity">Received Quantity</Label>
              <Input
                id="receivedQuantity"
                type="number"
                value={editData?.receivedQuantity || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, receivedQuantity: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Reject Receive</ModalTitle>
            <ModalDescription>
              Please provide a reason for rejecting this receive.
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection"
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectOpen(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectReceive}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle>Image Preview</ModalTitle>
          </ModalHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
} 