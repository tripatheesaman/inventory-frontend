'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
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
import { IMAGE_BASE_URL } from '@/constants/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useCustomToast } from '@/components/ui/custom-toast';
import Image from 'next/image';

interface PendingRequest {
  requestId: number;
  requestNumber: string;
  requestDate: string;
  requestedBy: string;
}

interface RequestItem {
  id: number;
  requestNumber: string;
  itemName: string;
  partNumber: string;
  nacCode: string;
  equipmentNumber: string;
  requestedQuantity: number;
  imageUrl: string;
  specifications: string;
  remarks: string;
}

interface EditItemData {
  id: number;
  itemName: string;
  partNumber: string;
  nacCode: string;
  equipmentNumber: string;
  requestedQuantity: number;
  specifications: string;
  remarks: string;
  imageUrl: string;
  newImage?: File;
}

export function PendingRequestsCount() {
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
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<{
    items: RequestItem[];
    requestNumber: string;
    requestDate: string;
    remarks: string;
    requestedBy: string;
  } | null>(null);
  const [editData, setEditData] = useState<{
    requestNumber: string;
    requestDate: Date;
    remarks: string;
    items: EditItemData[];
  } | null>(null);

  const fetchPendingCount = useCallback(async () => {
    if (!permissions?.includes('can_approve_request')) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.get('/api/request/pending');
      const uniqueRequests = response.data.reduce((acc: PendingRequest[], curr: PendingRequest) => {
        if (!acc.find(req => req.requestNumber === curr.requestNumber)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      
      setPendingRequests(uniqueRequests);
      setPendingCount(uniqueRequests.length);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const handleViewDetails = async (requestNumber: string, requestDate: string) => {
    try {
      const response = await API.get(`/api/request/items/${requestNumber}`);
      if (response.status === 200) {
        setSelectedRequest({
          items: response.data,
          requestNumber,
          requestDate,
          remarks: response.data[0]?.remarks || '',
          requestedBy: response.data[0]?.requestedBy || ''
        });
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl.startsWith('http') ? imageUrl : `${IMAGE_BASE_URL}${imageUrl.replace(/^\//, '')}`);
    setIsImagePreviewOpen(true);
  };

  const handleEditClick = () => {
    if (!selectedRequest) return;
    
    setEditData({
      requestNumber: selectedRequest.requestNumber,
      requestDate: new Date(selectedRequest.requestDate),
      remarks: selectedRequest.remarks,
      items: selectedRequest.items.map(item => ({
        ...item,
        newImage: undefined
      }))
    });
    setIsEditOpen(true);
  };

  const handleImageChange = (itemId: number, file: File) => {
    if (!editData) return;
    
    setEditData({
      ...editData,
      items: editData.items.map(item => 
        item.id === itemId ? { ...item, newImage: file } : item
      )
    });
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    try {
      const requestData = {
        requestNumber: editData.requestNumber,
        requestDate: editData.requestDate.toISOString(),
        remarks: editData.remarks,
        items: editData.items.map(item => ({
          id: item.id,
          itemName: item.itemName,
          partNumber: item.partNumber,
          nacCode: item.nacCode,
          equipmentNumber: item.equipmentNumber,
          requestedQuantity: item.requestedQuantity,
          specifications: item.specifications,
          remarks: item.remarks,
          imageUrl: item.imageUrl
        }))
      };

      const response = await API.put(`/api/request/${selectedRequest?.requestNumber}`, requestData);

      if (response.status === 200) {
        // Update the pending requests list with the new request number
        setPendingRequests(prevRequests => 
          prevRequests.map(request => 
            request.requestNumber === selectedRequest?.requestNumber
              ? {
                  ...request,
                  requestNumber: editData.requestNumber,
                  requestDate: editData.requestDate.toISOString()
                }
              : request
          )
        );

        // Update the selected request with new data
        setSelectedRequest(prev => prev ? {
          ...prev,
          requestNumber: editData.requestNumber,
          requestDate: editData.requestDate.toISOString(),
          remarks: editData.remarks,
          items: editData.items.map(item => ({
            ...item,
            requestNumber: editData.requestNumber
          }))
        } : null);

        showSuccessToast({
          title: "Success",
          message: "Request updated successfully",
          duration: 3000,
        });
        setIsEditOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update request",
        duration: 5000,
      });
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      const response = await API.put(`/api/request/${selectedRequest.requestNumber}/approve`, {
        approvedBy: user?.UserInfo?.username
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Request approved successfully",
          duration: 3000,
        });

        // Refresh the pending requests count
        const pendingResponse = await API.get('/api/request/pending');
        const uniqueRequests = pendingResponse.data.reduce((acc: PendingRequest[], curr: PendingRequest) => {
          if (!acc.find(req => req.requestNumber === curr.requestNumber)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setPendingRequests(uniqueRequests);
        setPendingCount(uniqueRequests.length);
        setIsDetailsOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to approve request",
        duration: 5000,
      });
    }
  };

  const handleRejectClick = () => {
    setIsRejectOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showErrorToast({
        title: "Error",
        message: "Please provide a reason for rejection",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await API.put(`/api/request/${selectedRequest.requestNumber}/reject`, {
        rejectedBy: user?.UserInfo?.username,
        rejectionReason: rejectionReason.trim()
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Request rejected successfully",
          duration: 3000,
        });

        // Refresh the pending requests count
        const pendingResponse = await API.get('/api/request/pending');
        const uniqueRequests = pendingResponse.data.reduce((acc: PendingRequest[], curr: PendingRequest) => {
          if (!acc.find(req => req.requestNumber === curr.requestNumber)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setPendingRequests(uniqueRequests);
        setPendingCount(uniqueRequests.length);
        setIsDetailsOpen(false);
        setIsRejectOpen(false);
        setRejectionReason('');
      } else {
        throw new Error(response.data?.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to reject request",
        duration: 5000,
      });
    }
  };

  if (!permissions?.includes('can_approve_request')) {
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
              <CardTitle className="text-base font-semibold text-[#003594]">Pending Requests</CardTitle>
              <FileText className="h-5 w-5 text-[#003594]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-3xl font-bold text-[#003594]">...</div>
              ) : (
                <div className="text-3xl font-bold text-[#003594]">{pendingCount ?? 0}</div>
              )}
              <p className="text-sm text-gray-500 mt-1">Requests awaiting approval</p>
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-3xl bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
              Pending Requests
            </ModalTitle>
            <ModalDescription className="text-gray-600 mt-2">
              You have {pendingCount ?? 0} pending request{pendingCount !== 1 ? 's' : ''} that need your attention.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {pendingRequests.map((request) => (
              <div
                key={request.requestId}
                className="rounded-lg border border-[#002a6e]/10 p-6 hover:bg-[#003594]/5 transition-all duration-200 hover:shadow-md"
              >
                <div className="grid grid-cols-4 gap-6 items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Request #</p>
                    <p className="text-lg font-semibold text-gray-900">{request.requestNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Date</p>
                    <p className="text-lg font-semibold text-gray-900">{new Date(request.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#003594]">Requested By</p>
                    <p className="text-lg font-semibold text-gray-900">{request.requestedBy}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleViewDetails(request.requestNumber, request.requestDate)}
                      className="flex items-center gap-2 bg-[#003594] hover:bg-[#003594]/90 text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="max-w-5xl bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
                  Request Details #{selectedRequest?.requestNumber}
                </ModalTitle>
                <div className="mt-2 text-gray-600 space-y-2">
                  <div className="flex items-center gap-4">
                    <span>Request Date: {selectedRequest?.requestDate && new Date(selectedRequest.requestDate).toLocaleDateString()}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                    <span>Requested By: {selectedRequest?.requestedBy}</span>
                  </div>
                  {selectedRequest?.remarks && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-[#002a6e]/10">
                      <span className="font-medium text-[#003594]">Remarks: </span>
                      {selectedRequest.remarks}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594] transition-colors"
                  onClick={handleEditClick}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Details
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
                  onClick={handleApproveRequest}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2 bg-[#d2293b] hover:bg-[#d2293b]/90 transition-colors"
                  onClick={handleRejectClick}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </ModalHeader>
          <div className="mt-6">
            <div className="overflow-x-auto rounded-lg border border-[#002a6e]/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#003594]/5">
                    <th className="text-left p-4 font-semibold text-[#003594]">Item Name</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Part Number</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Equipment Number</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Quantity</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Specifications</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest?.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#002a6e]/10 hover:bg-[#003594]/5 transition-colors">
                      <td className="p-4 text-gray-900">{item.itemName}</td>
                      <td className="p-4 text-gray-900">{item.partNumber}</td>
                      <td className="p-4 text-gray-900">{item.equipmentNumber}</td>
                      <td className="p-4 text-gray-900">{item.requestedQuantity}</td>
                      <td className="p-4 text-gray-900">{item.specifications || '-'}</td>
                      <td className="p-4">
                        <Image
                          src={item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl.replace(/^\//, '')}`) : '/images/nepal_airlines_logo.png'}
                          alt={item.itemName}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-lg border border-[#002a6e]/10 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => item.imageUrl && handleImageClick(item.imageUrl)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/nepal_airlines_logo.png';
                          }}
                          unoptimized={item.imageUrl ? item.imageUrl.startsWith('http') : false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isEditOpen} onOpenChange={setIsEditOpen}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Edit Request Details</ModalTitle>
          </ModalHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requestNumber" className="text-[#003594] font-medium">Request Number</Label>
                <Input
                  id="requestNumber"
                  value={editData?.requestNumber || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, requestNumber: e.target.value } : null)}
                  className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#003594] font-medium">Request Date</Label>
                <Calendar
                  value={editData?.requestDate}
                  onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, requestDate: date || prev.requestDate } : null)}
                  className="rounded-lg border border-[#002a6e]/10 transition-colors hover:border-[#003594]/30"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-[#003594] font-medium">Remarks</Label>
              <Textarea
                id="remarks"
                value={editData?.remarks || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, remarks: e.target.value } : null)}
                className="min-h-[100px] border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#003594]">Items</h3>
              <div className="space-y-6">
                {editData?.items.map((item) => (
                  <div key={item.id} className="border border-[#002a6e]/10 rounded-lg p-6 space-y-6 bg-white hover:shadow-md transition-all duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[#003594] font-medium">Item Name</Label>
                        <Input 
                          value={item.itemName}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, itemName: e.target.value } : i
                            )
                          } : null)}
                          className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#003594] font-medium">Part Number</Label>
                        <Input 
                          value={item.partNumber}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, partNumber: e.target.value } : i
                            )
                          } : null)}
                          className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#003594] font-medium">Equipment Number</Label>
                        <Input 
                          value={item.equipmentNumber}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, equipmentNumber: e.target.value } : i
                            )
                          } : null)}
                          className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#003594] font-medium">Quantity</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={item.requestedQuantity}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, requestedQuantity: parseInt(e.target.value) || 0 } : i
                            )
                          } : null)}
                          className="border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[#003594] font-medium">Specifications</Label>
                      <Textarea
                        value={item.specifications}
                        onChange={(e) => setEditData(prev => prev ? {
                          ...prev,
                          items: prev.items.map(i => 
                            i.id === item.id ? { ...i, specifications: e.target.value } : i
                          )
                        } : null)}
                        className="min-h-[80px] border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#003594] font-medium">Image</Label>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl.replace(/^\//, '')}`}
                            alt={item.itemName}
                            width={96}
                            height={96}
                            className="w-24 h-24 object-cover rounded-lg border border-[#002a6e]/10 hover:opacity-80 transition-opacity"
                            unoptimized={item.imageUrl.startsWith('http')}
                          />
                        )}
                        <div className="flex-1 w-full">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange(item.id, file);
                            }}
                            className="w-full border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEditData(prev => prev ? {
                          ...prev,
                          items: prev.items.filter(i => i.id !== item.id)
                        } : null)}
                        className="bg-[#d2293b] hover:bg-[#d2293b]/90 transition-colors"
                      >
                        Delete Item
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#002a6e]/10">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594] transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="bg-[#003594] hover:bg-[#003594]/90 text-white transition-colors"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <ModalContent className="max-w-4xl bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Image Preview</ModalTitle>
          </ModalHeader>
          <div className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 hover:bg-[#003594]/5 transition-colors"
              onClick={() => setIsImagePreviewOpen(false)}
            >
              <X className="h-4 w-4 text-[#003594]" />
            </Button>
            <Image
              src={selectedImage}
              alt="Preview"
              width={800}
              height={600}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg border border-[#002a6e]/10"
              unoptimized={selectedImage.startsWith('http')}
            />
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <ModalContent className="max-w-md bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-semibold text-[#003594]">Reject Request</ModalTitle>
            <ModalDescription className="text-gray-600 mt-2">
              Please provide a reason for rejecting this request.
            </ModalDescription>
          </ModalHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-[#003594] font-medium">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection"
                className="min-h-[100px] border-[#002a6e]/20 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
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
                className="border-[#002a6e]/20 hover:bg-[#003594]/5 hover:text-[#003594] transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectRequest}
                disabled={!rejectionReason.trim()}
                className="bg-[#d2293b] hover:bg-[#d2293b]/90 disabled:opacity-50 transition-colors"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
} 