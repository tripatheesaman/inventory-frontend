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
import { Trash2 } from 'lucide-react';
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
      forex_rate: value
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-[#002a6e]">
              RRP Details - {rrpData.rrpNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* RRP Information */}
            <Card className="border-[#002a6e]/10 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#002a6e]">RRP Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">RRP Number</Label>
                    <Input
                      value={isEditMode ? editData?.rrpNumber : rrpData.rrpNumber}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, rrpNumber: e.target.value } : null)}
                      disabled={!isEditMode}
                      className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">RRP Date</Label>
                    {isEditMode ? (
                      <Calendar
                        value={editData?.rrpDate ? new Date(editData.rrpDate) : undefined}
                        onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, rrpDate: date?.toISOString() || '' } : null)}
                        className="rounded-md border"
                      />
                    ) : (
                      <Input
                        value={new Date(rrpData.rrpDate).toLocaleDateString()}
                        disabled
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Type</Label>
                    <Input
                      value={rrpData.type.charAt(0).toUpperCase() + rrpData.type.slice(1)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Supplier</Label>
                    {isEditMode ? (
                      <Select
                        value={editData?.supplier}
                        onValueChange={(value) => setEditData(prev => prev ? { ...prev, supplier: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSupplierList().map((supplier) => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rrpData.supplier}
                        disabled
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Inspection User</Label>
                    {isEditMode ? (
                      <Select
                        value={editData?.inspectionUser}
                        onValueChange={(value) => setEditData(prev => prev ? { ...prev, inspectionUser: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select inspection user" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.inspection_user_details.map((user) => (
                            <SelectItem key={user.name} value={`${user.name},${user.designation}`}>
                              {user.name} - {user.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rrpData.inspectionUser}
                        disabled
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Invoice Number</Label>
                    <Input
                      value={isEditMode ? editData?.invoiceNumber : rrpData.invoiceNumber}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, invoiceNumber: e.target.value } : null)}
                      disabled={!isEditMode}
                      className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Invoice Date</Label>
                    {isEditMode ? (
                      <Calendar
                        value={editData?.invoiceDate ? new Date(editData.invoiceDate) : undefined}
                        onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, invoiceDate: date?.toISOString() || '' } : null)}
                        className="rounded-md border"
                      />
                    ) : (
                      <Input
                        value={new Date(rrpData.invoiceDate).toLocaleDateString()}
                        disabled
                      />
                    )}
                  </div>
                  {rrpData.type === 'foreign' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Customs Date</Label>
                        {isEditMode ? (
                          <Calendar
                            value={editData?.customsDate ? new Date(editData.customsDate) : undefined}
                            onChange={(date: Date | null) => setEditData(prev => prev ? { ...prev, customsDate: date?.toISOString() || '' } : null)}
                            className="rounded-md border"
                          />
                        ) : (
                          <Input
                            value={rrpData.customsDate ? new Date(rrpData.customsDate).toLocaleDateString() : '-'}
                            disabled
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Customs Number</Label>
                        <Input
                          value={isEditMode ? (editData?.customsNumber || '') : (rrpData.customsNumber || '')}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, customsNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">PO Number</Label>
                        <Input
                          value={isEditMode ? editData?.poNumber : rrpData.poNumber}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, poNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Airway Bill Number</Label>
                        <Input
                          value={isEditMode ? editData?.airwayBillNumber : rrpData.airwayBillNumber}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, airwayBillNumber: e.target.value } : null)}
                          disabled={!isEditMode}
                          className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Currency</Label>
                        {isEditMode ? (
                          <Select
                            value={editData?.currency}
                            onValueChange={(value) => setEditData(prev => prev ? { ...prev, currency: value } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCurrencies().map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={rrpData.currency}
                            disabled
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Forex Rate</Label>
                        <Input
                          type="number"
                          value={isEditMode ? editData?.forexRate?.toString() || '' : rrpData.forexRate?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 1 : parseFloat(e.target.value);
                            handleForexRateChange(value);
                          }}
                          disabled={!isEditMode}
                          className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="border-[#002a6e]/10 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#002a6e]">Items</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto rounded-lg border border-[#002a6e]/10">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="hover:bg-gray-50">
                        <TableHead className="min-w-[200px] font-semibold text-[#002a6e]">Item Name</TableHead>
                        <TableHead className="min-w-[150px] font-semibold text-[#002a6e]">Part Number</TableHead>
                        <TableHead className="min-w-[150px] font-semibold text-[#002a6e]">NAC Code</TableHead>
                        <TableHead className="min-w-[150px] font-semibold text-[#002a6e]">Equipment Number</TableHead>
                        <TableHead className="min-w-[100px] text-right font-semibold text-[#002a6e]">Quantity</TableHead>
                        <TableHead className="min-w-[100px] font-semibold text-[#002a6e]">Unit</TableHead>
                        <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Price</TableHead>
                        <TableHead className="min-w-[100px] text-right font-semibold text-[#002a6e]">VAT %</TableHead>
                        <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Freight Charge</TableHead>
                        <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Customs Amount</TableHead>
                        {rrpData.type === 'foreign' && (
                          <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Custom Service</TableHead>
                        )}
                        <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Forex Rate</TableHead>
                        <TableHead className="min-w-[120px] text-right font-semibold text-[#002a6e]">Total</TableHead>
                        {isEditMode && <TableHead className="min-w-[100px] text-right font-semibold text-[#002a6e]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editData?.items || rrpData.items).map((item, index) => {
                        const itemTotals = calculateItemTotal(item);
                        return (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="py-4">
                              <div className="min-h-[40px] flex items-center">{item.item_name}</div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="min-h-[40px] flex items-center">{item.part_number}</div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="min-h-[40px] flex items-center">{item.nac_code}</div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="min-h-[40px] flex items-center">{item.equipment_number}</div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="min-h-[40px] flex items-center justify-end">{item.received_quantity}</div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="min-h-[40px] flex items-center">{item.unit}</div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  value={editData?.items[index].item_price}
                                  onChange={(e) => {
                                    const newItems = [...(editData?.items || [])];
                                    newItems[index] = { ...newItems[index], item_price: parseFloat(e.target.value) };
                                    setEditData(prev => prev ? { ...prev, items: newItems } : null);
                                  }}
                                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                />
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-end">{item.item_price}</div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  value={editData?.items[index].vat_percentage}
                                  onChange={(e) => {
                                    const newItems = [...(editData?.items || [])];
                                    newItems[index] = { ...newItems[index], vat_percentage: parseFloat(e.target.value) };
                                    setEditData(prev => prev ? { ...prev, items: newItems } : null);
                                  }}
                                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                />
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-end">{item.vat_percentage}</div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  value={editData?.items[index].freight_charge?.toString() || ''}
                                  onChange={(e) => {
                                    const newItems = [...(editData?.items || [])];
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    newItems[index] = { ...newItems[index], freight_charge: value };
                                    setEditData(prev => prev ? { ...prev, items: newItems } : null);
                                  }}
                                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                />
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-end">
                                  {itemTotals.freightCharge.toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  value={editData?.items[index].customs_charge?.toString() || ''}
                                  onChange={(e) => {
                                    const newItems = [...(editData?.items || [])];
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    newItems[index] = { ...newItems[index], customs_charge: value };
                                    setEditData(prev => prev ? { ...prev, items: newItems } : null);
                                  }}
                                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                />
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-end">
                                  {itemTotals.customsAmount.toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                            {rrpData.type === 'foreign' && (
                              <TableCell className="py-4 text-right">
                                {isEditMode ? (
                                  <Input
                                    type="number"
                                    value={editData?.items[index].customs_service_charge?.toString() || ''}
                                    onChange={(e) => {
                                      const newItems = [...(editData?.items || [])];
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      newItems[index] = { ...newItems[index], customs_service_charge: value };
                                      setEditData(prev => prev ? { ...prev, items: newItems } : null);
                                    }}
                                    className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                  />
                                ) : (
                                  <div className="min-h-[40px] flex items-center justify-end">
                                    {itemTotals.customServiceCharge.toFixed(2)}
                                  </div>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="py-4 text-right">
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  value={editData?.items[index].forex_rate?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? 1 : parseFloat(e.target.value);
                                    handleForexRateChange(value);
                                  }}
                                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                                />
                              ) : (
                                <div className="min-h-[40px] flex items-center justify-end">
                                  {item.forex_rate}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="min-h-[40px] flex items-center justify-end">
                                {itemTotals.total.toFixed(2)}
                              </div>
                            </TableCell>
                            {isEditMode && (
                              <TableCell className="py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="border-[#002a6e]/10 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-[#002a6e]/10">
                <CardTitle className="text-lg font-semibold text-[#002a6e]">Totals</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Item Price</Label>
                    <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.itemPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Freight Charge</Label>
                    <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.freightCharge.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Customs Amount</Label>
                    <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.customsAmount.toFixed(2)}</p>
                  </div>
                  {rrpData.type === 'foreign' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700">Custom Service</Label>
                      <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.customServiceCharge.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">VAT Amount</Label>
                    <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.vatAmount.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-[#002a6e]">
                    <Label className="text-sm font-medium text-gray-700">Total</Label>
                    <p className="text-lg font-semibold text-[#002a6e] mt-1">{totals.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <DialogFooter className="flex justify-end space-x-4 pt-4 border-t">
              {!isEditMode ? (
                <>
                  {!isEditOnly && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsRejectDialogOpen(true)}
                        className="border-[#002a6e]/20 text-[#002a6e] hover:bg-[#002a6e]/10"
                      >
                        Reject
                      </Button>
                      <Button 
                        onClick={handleApprove}
                        className="bg-[#002a6e] text-white hover:bg-[#002a6e]/90"
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={handleEditClick}
                    className="bg-[#002a6e] text-white hover:bg-[#002a6e]/90"
                  >
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="border-[#002a6e]/20 text-[#002a6e] hover:bg-[#002a6e]/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    className="bg-[#002a6e] text-white hover:bg-[#002a6e]/90"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-[#002a6e]">Reject RRP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Reason for Rejection</Label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
              />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(false)}
                className="border-[#002a6e]/20 text-[#002a6e] hover:bg-[#002a6e]/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                className="bg-[#002a6e] text-white hover:bg-[#002a6e]/90"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={itemToDelete !== null} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent className="bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-[#002a6e]">Delete Item</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setItemToDelete(null)}
              className="border-[#002a6e]/20 text-[#002a6e] hover:bg-[#002a6e]/10"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteItem}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 