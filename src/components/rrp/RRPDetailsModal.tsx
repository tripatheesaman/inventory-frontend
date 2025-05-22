'use client';

import { useState } from 'react';
import { useRRP } from '@/hooks/useRRP';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Trash2, Pencil } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

interface RRPDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rrpData: {
    items: any[];
    rrpNumber: string;
    rrpDate: string;
    type: 'local' | 'foreign';
    supplier: string;
    inspectionUser: string;
    invoiceNumber: string;
    invoiceDate: string;
    freightCharge: number;
    customsDate?: string;
    poNumber?: string;
    airwayBillNumber?: string;
    currency?: string;
    forexRate?: number;
    customsNumber?: string;
  };
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onEdit: (data: any) => void;
  onDeleteItem?: (itemId: number) => void;
  config: {
    supplier_list_local: string;
    supplier_list_foreign: string;
    inspection_user_details: Array<{
      name: string;
      designation: string;
    }>;
    vat_rate: number;
    customServiceCharge?: number;
  };
  isEditOnly?: boolean;
}

interface EditItemData {
  id: number;
  item_name: string;
  part_number: string;
  nac_code: string;
  equipment_number: string;
  received_quantity: number;
  unit: string;
  item_price: number;
  vat_percentage: number;
  customs_charge: number;
  currency: string;
  forex_rate: number;
  freight_charge: number;
  customs_service_charge: number;
  total_amount: number;
}

export function RRPDetailsModal({
  isOpen,
  onClose,
  rrpData,
  onApprove,
  onReject,
  onEdit,
  onDeleteItem,
  config,
  isEditOnly = false,
}: RRPDetailsModalProps) {
  const { getCurrencies } = useRRP();
  const { showErrorToast } = useCustomToast();
  const { markAsRead } = useNotification();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    items: EditItemData[];
    rrpNumber: string;
    rrpDate: string;
    type: 'local' | 'foreign';
    supplier: string;
    inspectionUser: string;
    invoiceNumber: string;
    invoiceDate: string;
    freightCharge: number;
    customsDate?: string;
    poNumber?: string;
    airwayBillNumber?: string;
    currency?: string;
    forexRate?: number;
    customsNumber?: string;
  } | null>(null);

  const handleEditClick = () => {
    // Ensure all numeric values are properly initialized when entering edit mode
    const initialEditData = {
      ...rrpData,
      items: rrpData.items.map(item => ({
        ...item,
        freight_charge: parseFloat(item.freight_charge?.toString() || '0') || 0,
        customs_charge: parseFloat(item.customs_charge?.toString() || '0') || 0,
        customs_service_charge: parseFloat(item.customs_service_charge?.toString() || '0') || 0,
        item_price: parseFloat(item.item_price?.toString() || '0') || 0,
        vat_percentage: parseFloat(item.vat_percentage?.toString() || '0') || 0,
        forex_rate: parseFloat(item.forex_rate?.toString() || '1') || 1,
        received_quantity: parseFloat(item.received_quantity?.toString() || '0') || 0
      }))
    };
    setEditData(initialEditData);
    setIsEditMode(true);
  };

  const handleForexRateChange = (value: number) => {
    if (!editData) return;

    // Update the forex rate for all items
    const updatedItems = editData.items.map(item => ({
      ...item,
      forex_rate: value,
      item_price: item.item_price * value,
      total_amount: (item.item_price * value) + item.freight_charge + item.customs_charge + item.customs_service_charge
    }));

    setEditData({
      ...editData,
      forexRate: value,
      items: updatedItems
    });
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    // Calculate new totals for each item
    const processedData = {
      ...editData,
      items: editData.items.map(item => {
        const itemTotals = calculateItemTotal(item);
        return {
          ...item,
          freight_charge: parseFloat(item.freight_charge?.toString() || '0') || 0,
          customs_charge: parseFloat(item.customs_charge?.toString() || '0') || 0,
          customs_service_charge: parseFloat(item.customs_service_charge?.toString() || '0') || 0,
          item_price: parseFloat(item.item_price?.toString() || '0') || 0,
          vat_percentage: parseFloat(item.vat_percentage?.toString() || '0') || 0,
          forex_rate: parseFloat(item.forex_rate?.toString() || '1') || 1,
          received_quantity: parseFloat(item.received_quantity?.toString() || '0') || 0,
          total_amount: itemTotals.total
        };
      })
    };

    try {
      await onEdit(processedData);
      setIsEditMode(false);
      setEditData(null);
    } catch (error) {
      console.error('Error saving RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to save RRP changes",
        duration: 3000,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData(null);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    try {
      await onApprove();
    
      const searchParams = new URLSearchParams(window.location.search);
      const notificationId = searchParams.get('notificationId');
      if (notificationId) {
        await markAsRead(Number(notificationId));
      }
    } catch (error) {
      console.error('Error approving RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to approve RRP",
        duration: 3000,
      });
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    if (!rejectionReason.trim()) {
      showErrorToast({
        title: "Validation Error",
        message: "Please provide a reason for rejection",
        duration: 3000,
      });
      return;
    }

    try {
      await onReject(rejectionReason);
      // Mark notification as read if it exists
      const searchParams = new URLSearchParams(window.location.search);
      const notificationId = searchParams.get('notificationId');
      if (notificationId) {
        await markAsRead(Number(notificationId));
      }
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to reject RRP",
        duration: 3000,
      });
    }
  };

  const calculateItemTotal = (item: EditItemData) => {
    try {
      // Safely parse all numeric values with null checks
      const itemPrice = item?.item_price ? parseFloat(String(item.item_price)) : 0;
      const quantity = item?.received_quantity ? parseFloat(String(item.received_quantity)) : 0;
      const vatPercentage = item?.vat_percentage ? parseFloat(String(item.vat_percentage)) : 0;
      const customsCharge = item?.customs_charge ? parseFloat(String(item.customs_charge)) : 0;
      const forexRate = item?.forex_rate ? parseFloat(String(item.forex_rate)) : 1;
      const freightCharge = item?.freight_charge ? parseFloat(String(item.freight_charge)) : 0;
      const customServiceCharge = item?.customs_service_charge ? parseFloat(String(item.customs_service_charge)) : 0;

      // Calculate base item price with forex rate (no need to multiply by quantity)
      const baseItemPrice = itemPrice * forexRate;
      
      // Calculate VAT on all charges
      const vatAmount = (baseItemPrice + freightCharge + customsCharge + customServiceCharge) * (vatPercentage / 100);

      // Calculate total
      const total = baseItemPrice + freightCharge + customsCharge + customServiceCharge + vatAmount;

      return {
        itemPrice: baseItemPrice,
        freightCharge,
        customsAmount: customsCharge,
        customServiceCharge,
        vatAmount,
        total
      };
    } catch (error) {
      console.error('Error calculating item total:', error);
      return {
        itemPrice: 0,
        freightCharge: 0,
        customsAmount: 0,
        customServiceCharge: 0,
        vatAmount: 0,
        total: 0
      };
    }
  };

  const calculateTotals = (items: EditItemData[]) => {
    try {
      if (!Array.isArray(items)) {
        console.error('Items is not an array:', items);
        return {
          itemPrice: 0,
          freightCharge: 0,
          customsAmount: 0,
          customServiceCharge: 0,
          vatAmount: 0,
          total: 0
        };
      }

      const totals = items.reduce((acc, item) => {
        if (!item) return acc;
        const itemTotals = calculateItemTotal(item);
        return {
          itemPrice: acc.itemPrice + itemTotals.itemPrice,
          freightCharge: acc.freightCharge + itemTotals.freightCharge,
          customsAmount: acc.customsAmount + itemTotals.customsAmount,
          customServiceCharge: acc.customServiceCharge + itemTotals.customServiceCharge,
          vatAmount: acc.vatAmount + itemTotals.vatAmount,
          total: acc.total + itemTotals.total,
        };
      }, {
        itemPrice: 0,
        freightCharge: 0,
        customsAmount: 0,
        customServiceCharge: 0,
        vatAmount: 0,
        total: 0
      });

      return totals;
    } catch (error) {
      console.error('Error calculating totals:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to calculate totals",
        duration: 3000,
      });
      return {
        itemPrice: 0,
        freightCharge: 0,
        customsAmount: 0,
        customServiceCharge: 0,
        vatAmount: 0,
        total: 0
      };
    }
  };

  const getSupplierList = () => {
    return rrpData.type === 'local' 
      ? config.supplier_list_local.split(',').map(s => s.trim())
      : config.supplier_list_foreign.split(',').map(s => s.trim());
  };

  const currentItems = editData?.items || rrpData.items;
  const totals = calculateTotals(currentItems);

  const handleDeleteItem = (itemId: number) => {
    if (!onDeleteItem) return;
    setItemToDelete(itemId);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete !== null && editData && onDeleteItem) {
      // Update the editData state first
      const updatedItems = editData.items.filter(item => item.id !== itemToDelete);
      setEditData({
        ...editData,
        items: updatedItems
      });
      
      // Call the onDeleteItem callback
      onDeleteItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-[#002a6e]/10">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
              RRP Details - {rrpData.rrpNumber}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Review and manage RRP information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* RRP Information */}
            <Card className="border-[#002a6e]/10 hover:border-[#d2293b]/20 transition-all duration-300 shadow-sm">
              <CardHeader className="bg-[#003594]/5 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#003594]">RRP Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">RRP Date</Label>
                    {isEditMode ? (
                      <Calendar
                        value={editData?.rrpDate ? new Date(editData.rrpDate) : undefined}
                        onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, rrpDate: date?.toISOString() || '' } : null)}
                        className="rounded-md border border-[#002a6e]/10 bg-white"
                      />
                    ) : (
                      <Input
                        value={format(new Date(rrpData.rrpDate), 'PPP')}
                        disabled
                        className="bg-gray-50 border-[#002a6e]/10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">Type</Label>
                    {isEditMode ? (
                      <Select
                        value={editData?.type}
                        onValueChange={(value: 'local' | 'foreign') => setEditData(prev => prev ? { ...prev, type: value } : null)}
                      >
                        <SelectTrigger className="border-[#002a6e]/10 focus:ring-[#003594] bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#002a6e]/10">
                          <SelectItem value="local" className="hover:bg-[#003594]/5">Local</SelectItem>
                          <SelectItem value="foreign" className="hover:bg-[#003594]/5">Foreign</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rrpData.type.charAt(0).toUpperCase() + rrpData.type.slice(1)}
                        disabled
                        className="bg-gray-50 border-[#002a6e]/10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">Supplier</Label>
                    {isEditMode ? (
                      <Select
                        value={editData?.supplier}
                        onValueChange={(value) => setEditData(prev => prev ? { ...prev, supplier: value } : null)}
                      >
                        <SelectTrigger className="border-[#002a6e]/10 focus:ring-[#003594] bg-white">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#002a6e]/10">
                          {getSupplierList().map((supplier) => (
                            <SelectItem key={supplier} value={supplier} className="hover:bg-[#003594]/5">
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rrpData.supplier}
                        disabled
                        className="bg-gray-50 border-[#002a6e]/10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">Inspection User</Label>
                    {isEditMode ? (
                      <Select
                        value={editData?.inspectionUser}
                        onValueChange={(value) => setEditData(prev => prev ? { ...prev, inspectionUser: value } : null)}
                      >
                        <SelectTrigger className="border-[#002a6e]/10 focus:ring-[#003594] bg-white">
                          <SelectValue placeholder="Select inspection user" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#002a6e]/10">
                          {config.inspection_user_details.map((user) => (
                            <SelectItem key={user.name} value={`${user.name},${user.designation}`} className="hover:bg-[#003594]/5">
                              {user.name} - {user.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rrpData.inspectionUser}
                        disabled
                        className="bg-gray-50 border-[#002a6e]/10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">Invoice Number</Label>
                    <Input
                      value={isEditMode ? (editData?.invoiceNumber || '') : (rrpData.invoiceNumber || '')}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, invoiceNumber: e.target.value } : null)}
                      disabled={!isEditMode}
                      className={`${isEditMode ? 'bg-white' : 'bg-gray-50'} border-[#002a6e]/10 focus:ring-[#003594]`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#003594]">Invoice Date</Label>
                    {isEditMode ? (
                      <Calendar
                        value={editData?.invoiceDate ? new Date(editData.invoiceDate) : undefined}
                        onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, invoiceDate: date?.toISOString() || '' } : null)}
                        className="rounded-md border border-[#002a6e]/10 bg-white"
                      />
                    ) : (
                      <Input
                        value={format(new Date(rrpData.invoiceDate), 'PPP')}
                        disabled
                        className="bg-gray-50 border-[#002a6e]/10"
                      />
                    )}
                  </div>
                  {rrpData.type === 'foreign' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">Customs Date</Label>
                        {isEditMode ? (
                          <Calendar
                            value={editData?.customsDate ? new Date(editData.customsDate) : undefined}
                            onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, customsDate: date?.toISOString() || '' } : null)}
                            className="rounded-md border border-[#002a6e]/10 bg-white"
                          />
                        ) : (
                          <Input
                            value={rrpData.customsDate ? format(new Date(rrpData.customsDate), 'PPP') : '-'}
                            disabled
                            className="bg-gray-50 border-[#002a6e]/10"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">Customs Number</Label>
                        <Input
                          value={isEditMode ? (editData?.customsNumber || '') : (rrpData.customsNumber || '')}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, customsNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className={`${isEditMode ? 'bg-white' : 'bg-gray-50'} border-[#002a6e]/10 focus:ring-[#003594]`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">PO Number</Label>
                        <Input
                          value={isEditMode ? (editData?.poNumber || '') : (rrpData.poNumber || '')}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, poNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className={`${isEditMode ? 'bg-white' : 'bg-gray-50'} border-[#002a6e]/10 focus:ring-[#003594]`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">Airway Bill Number</Label>
                        <Input
                          value={isEditMode ? (editData?.airwayBillNumber || '') : (rrpData.airwayBillNumber || '')}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, airwayBillNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className={`${isEditMode ? 'bg-white' : 'bg-gray-50'} border-[#002a6e]/10 focus:ring-[#003594]`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">Currency</Label>
                        {isEditMode ? (
                          <Select
                            value={editData?.currency}
                            onValueChange={(value) => setEditData(prev => prev ? { ...prev, currency: value } : null)}
                          >
                            <SelectTrigger className="border-[#002a6e]/10 focus:ring-[#003594] bg-white">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#002a6e]/10">
                              {getCurrencies().map((currency) => (
                                <SelectItem key={currency} value={currency} className="hover:bg-[#003594]/5">
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={rrpData.currency}
                            disabled
                            className="bg-gray-50 border-[#002a6e]/10"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#003594]">Forex Rate</Label>
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={editData?.forexRate || ''}
                            onChange={(e) => handleForexRateChange(parseFloat(e.target.value) || 0)}
                            className="border-[#002a6e]/10 focus:ring-[#003594] bg-white"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          <Input
                            value={rrpData.forexRate}
                            disabled
                            className="bg-gray-50 border-[#002a6e]/10"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="border-[#002a6e]/10 hover:border-[#d2293b]/20 transition-all duration-300 shadow-sm">
              <CardHeader className="bg-[#003594]/5 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#003594]">Items</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#003594]/5 hover:bg-[#003594]/10">
                        <TableHead className="text-[#003594] font-semibold">Item Name</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Part Number</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Equipment Number</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Quantity</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Unit</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Price</TableHead>
                        <TableHead className="text-[#003594] font-semibold">VAT%</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Customs Charge</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Freight Charge</TableHead>
                        <TableHead className="text-[#003594] font-semibold">Total Amount</TableHead>
                        {isEditMode && <TableHead className="text-[#003594] font-semibold">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((isEditMode ? editData?.items : rrpData.items) || []).map((item) => (
                        <TableRow key={item.id} className="hover:bg-[#003594]/5">
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell>{item.equipment_number}</TableCell>
                          <TableCell>{item.received_quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.item_price}</TableCell>
                          <TableCell>{item.vat_percentage}%</TableCell>
                          <TableCell>{item.customs_charge}</TableCell>
                          <TableCell>{item.freight_charge}</TableCell>
                          <TableCell>{item.total_amount}</TableCell>
                          {isEditMode && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedItems = editData?.items.map(i => 
                                      i.id === item.id ? { ...i, isEditing: true } : i
                                    );
                                    setEditData(prev => prev ? { ...prev, items: updatedItems || [] } : null);
                                  }}
                                  className="text-[#003594] hover:text-[#002a6e] hover:bg-[#003594]/5"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="border-[#002a6e]/10 hover:border-[#d2293b]/20 transition-all duration-300 shadow-sm">
              <CardHeader className="bg-[#003594]/5 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#003594]">Totals</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">Item Price</Label>
                    <p className="text-lg font-semibold text-[#003594]">{totals.itemPrice.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">Freight Charge</Label>
                    <p className="text-lg font-semibold text-[#003594]">{totals.freightCharge.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">Customs Amount</Label>
                    <p className="text-lg font-semibold text-[#003594]">{totals.customsAmount.toFixed(2)}</p>
                  </div>
                  {rrpData.type === 'foreign' && (
                    <div className="space-y-1">
                      <Label className="text-sm text-gray-500">Custom Service</Label>
                      <p className="text-lg font-semibold text-[#003594]">{totals.customServiceCharge.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">VAT Amount</Label>
                    <p className="text-lg font-semibold text-[#003594]">{totals.vatAmount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">Total</Label>
                    <p className="text-lg font-semibold text-[#003594]">{totals.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#002a6e]/10">
              {!isEditOnly && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="border-[#d2293b]/20 hover:border-[#d2293b] hover:bg-[#d2293b]/5 text-[#d2293b]"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-[#003594] hover:bg-[#002a6e] text-white transition-colors"
                  >
                    Approve
                  </Button>
                </>
              )}
              {!isEditMode && !isEditOnly && (
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  className="border-[#003594]/20 hover:border-[#003594] hover:bg-[#003594]/5 text-[#003594]"
                >
                  Edit
                </Button>
              )}
              {isEditMode && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-[#d2293b]/20 hover:border-[#d2293b] hover:bg-[#d2293b]/5 text-[#d2293b]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-[#003594] hover:bg-[#002a6e] text-white transition-colors"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-[#002a6e]/10">
            <DialogTitle className="text-xl font-bold text-[#003594]">Reject RRP</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this RRP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason" className="text-[#003594]">Reason</Label>
              <Input
                id="rejectReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="border-[#002a6e]/10 focus:ring-[#003594]"
                placeholder="Enter rejection reason"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-[#002a6e]/10">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              className="border-[#d2293b]/20 hover:border-[#d2293b] hover:bg-[#d2293b]/5 text-[#d2293b]"
            >
                Cancel
              </Button>
            <Button
              onClick={handleReject}
              className="bg-[#d2293b] hover:bg-[#b31f2f] text-white"
            >
              Confirm Reject
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-[#002a6e]/10">
            <DialogTitle className="text-xl font-bold text-[#003594]">Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t border-[#002a6e]/10">
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              className="border-[#d2293b]/20 hover:border-[#d2293b] hover:bg-[#d2293b]/5 text-[#d2293b]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteItem}
              className="bg-[#d2293b] hover:bg-[#b31f2f] text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 