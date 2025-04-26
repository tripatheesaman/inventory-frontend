'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { API } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, X, Pencil } from 'lucide-react';
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
  equipmentNumber: string;
  requestedQuantity: number;
  specifications: string;
  remarks: string;
  imageUrl: string;
  newImage?: File;
}

export function PendingRequestsCount() {
  const { permissions } = useAuthContext();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<{
    items: RequestItem[];
    requestNumber: string;
    requestDate: string;
    remarks: string;
  } | null>(null);
  const [editData, setEditData] = useState<{
    requestNumber: string;
    requestDate: Date;
    remarks: string;
    items: EditItemData[];
  } | null>(null);

  useEffect(() => {
    const fetchPendingCount = async () => {
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
    };

    fetchPendingCount();
  }, [permissions]);

  const handleViewDetails = async (requestNumber: string, requestDate: string) => {
    try {
      const response = await API.get(`/api/request/items/${requestNumber}`);
      if (response.status === 200) {
        setSelectedRequest({
          items: response.data,
          requestNumber,
          requestDate,
          remarks: response.data[0]?.remarks || ''
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
      // First, upload any new images
      const updatedItems = await Promise.all(editData.items.map(async (item) => {
        if (item.newImage) {
          const formData = new FormData();
          formData.append('file', item.newImage);
          formData.append('folder', 'request');
          
          const uploadResponse = await API.post('/api/upload', formData);
          return {
            ...item,
            imageUrl: uploadResponse.data.path
          };
        }
        return item;
      }));

      // Then update the request details
      const response = await API.put(`/api/request/${editData.requestNumber}`, {
        requestNumber: editData.requestNumber,
        requestDate: editData.requestDate.toISOString(),
        remarks: editData.remarks,
        items: updatedItems.map(({ newImage, ...item }) => item)
      });

      if (response.status === 200) {
        // Refresh the request details
        const updatedResponse = await API.get(`/api/request/items/${editData.requestNumber}`);
        if (updatedResponse.status === 200) {
          setSelectedRequest({
            items: updatedResponse.data,
            requestNumber: editData.requestNumber,
            requestDate: editData.requestDate.toISOString(),
            remarks: editData.remarks
          });
        }
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  if (!permissions?.includes('can_approve_request')) {
    return null;
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{pendingCount}</div>
              )}
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle>Pending Requests</ModalTitle>
            <ModalDescription>
              You have {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} that need your attention.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-4 space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.requestId}
                className="rounded-lg border p-4 hover:bg-accent/50"
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium">Request #</p>
                    <p className="text-lg">{request.requestNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-lg">{new Date(request.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Requested By</p>
                    <p className="text-lg">{request.requestedBy}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleViewDetails(request.requestNumber, request.requestDate)}
                      className="flex items-center gap-2"
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
        <ModalContent className="max-w-5xl">
          <ModalHeader>
            <div className="flex justify-between items-center">
              <ModalTitle>Request Details #{selectedRequest?.requestNumber}</ModalTitle>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleEditClick}
              >
                <Pencil className="h-4 w-4" />
                Edit Details
              </Button>
            </div>
            <ModalDescription>
              <span>Request Date: {selectedRequest?.requestDate && new Date(selectedRequest.requestDate).toLocaleDateString()}</span>
              {selectedRequest?.remarks && (
                <span className="block mt-2">
                  <span className="font-medium">Remarks: </span>
                  {selectedRequest.remarks}
                </span>
              )}
            </ModalDescription>
          </ModalHeader>
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item Name</th>
                    <th className="text-left p-2">Part Number</th>
                    <th className="text-left p-2">Equipment Number</th>
                    <th className="text-left p-2">Quantity</th>
                    <th className="text-left p-2">Specifications</th>
                    <th className="text-left p-2">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest?.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.itemName}</td>
                      <td className="p-2">{item.partNumber}</td>
                      <td className="p-2">{item.equipmentNumber}</td>
                      <td className="p-2">{item.requestedQuantity}</td>
                      <td className="p-2">{item.specifications || '-'}</td>
                      <td className="p-2">
                        <img 
                          src={item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl.replace(/^\//, '')}`) : '/nepal_airlines_logo.png'}
                          alt={item.itemName}
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => item.imageUrl && handleImageClick(item.imageUrl)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/nepal_airlines_logo.png';
                          }}
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
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Edit Request Details</ModalTitle>
          </ModalHeader>
          <div className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestNumber">Request Number</Label>
                <Input
                  id="requestNumber"
                  value={editData?.requestNumber || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, requestNumber: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Request Date</Label>
                <Calendar
                  value={editData?.requestDate}
                  onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, requestDate: date || prev.requestDate } : null)}
                  className="rounded-md border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={editData?.remarks || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, remarks: e.target.value } : null)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Items</h3>
              <div className="space-y-6">
                {editData?.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4 bg-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input 
                          value={item.itemName}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, itemName: e.target.value } : i
                            )
                          } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Part Number</Label>
                        <Input 
                          value={item.partNumber}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, partNumber: e.target.value } : i
                            )
                          } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Equipment Number</Label>
                        <Input 
                          value={item.equipmentNumber}
                          onChange={(e) => setEditData(prev => prev ? {
                            ...prev,
                            items: prev.items.map(i => 
                              i.id === item.id ? { ...i, equipmentNumber: e.target.value } : i
                            )
                          } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
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
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Specifications</Label>
                      <Textarea
                        value={item.specifications}
                        onChange={(e) => setEditData(prev => prev ? {
                          ...prev,
                          items: prev.items.map(i => 
                            i.id === item.id ? { ...i, specifications: e.target.value } : i
                          )
                        } : null)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl.replace(/^\//, '')}`}
                            alt={item.itemName}
                            className="w-24 h-24 object-cover rounded"
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
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
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

      <Modal open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle>Image Preview</ModalTitle>
          </ModalHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={() => setIsImagePreviewOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
} 