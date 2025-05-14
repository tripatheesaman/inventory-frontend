'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useRRP } from '@/hooks/useRRP';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RRPPreview from '@/components/rrp/RRPPreview';

interface RRPItem {
  id: number;
  request_number: string;
  request_date: string;
  receive_date: string;
  equipment_number: string;
  requested_by: string;
  received_by: string | null;
  item_name: string;
  nac_code: string;
  part_number: string;
  received_quantity: string;
  unit: string;
}

interface CartItem extends Omit<RRPItem, 'received_quantity'> {
  price: number;
  quantity: number;
  vat: boolean;
  customsCharge?: number;
  total: number;
  rrp_date: string;
  currency: string;
  forex_rate: number;
}

export default function RRPItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showErrorToast } = useCustomToast();
  const { isLoading: isConfigLoading, getCurrencies } = useRRP();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<RRPItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RRPItem[]>([]);
  const [searchQueries, setSearchQueries] = useState({
    partNumber: '',
    equipmentNumber: '',
    universal: '',
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const cartData = searchParams.get('cart');
      return cartData ? JSON.parse(decodeURIComponent(cartData)) : [];
    } catch (error) {
      console.error('Error parsing cart data:', error);
      return [];
    }
  });
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const rrpType = searchParams.get('type') || 'local';
  const rrpDate = searchParams.get('rrpDate');

  useEffect(() => {
    console.log('Current RRP Type:', rrpType);
  }, [rrpType]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await API.get('/api/rrp/items');
        setItems(response.data);
        setFilteredItems(response.data);
      } catch (error) {
        console.error('Error fetching RRP items:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP items",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.part_number.toLowerCase().includes(searchQueries.partNumber.toLowerCase()) &&
      item.equipment_number.toLowerCase().includes(searchQueries.equipmentNumber.toLowerCase()) &&
      (
        item.nac_code.toLowerCase().includes(searchQueries.universal.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchQueries.universal.toLowerCase()) ||
        item.request_number.toLowerCase().includes(searchQueries.universal.toLowerCase())
      )
    );
    setFilteredItems(filtered);
  }, [searchQueries, items]);

  const handleItemDoubleClick = (item: RRPItem) => {
    const isForeign = rrpType === 'foreign';
    console.log('RRP Type:', rrpType, 'Is Foreign:', isForeign);
    const cartItem: CartItem = {
      ...item,
      price: 0,
      quantity: parseInt(item.received_quantity),
      vat: false,
      customsCharge: isForeign ? 0 : undefined,
      total: 0,
      rrp_date: rrpDate || new Date().toISOString(),
      currency: isForeign ? searchParams.get('currency') || 'USD' : 'NPR',
      forex_rate: isForeign ? parseFloat(searchParams.get('forexRate') || '1') : 1,
    };
    setSelectedItem(cartItem);
    setIsDialogOpen(true);
  };

  const handleAddToCart = (item: CartItem, price: number, quantity: number, vat: boolean, customsCharge?: number) => {
    const isForeign = rrpType === 'foreign';
    
    if (isForeign && (!customsCharge || customsCharge <= 0)) {
      showErrorToast({
        title: "Validation Error",
        message: "Customs charge is required for foreign RRP",
        duration: 3000,
      });
      return;
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    if (existingItemIndex !== -1) {
      showErrorToast({
        title: "Validation Error",
        message: "This item is already in the cart",
        duration: 3000,
      });
      return;
    }

    const total = price * quantity * (vat ? 1.15 : 1) + (customsCharge || 0);
    const cartItem: CartItem = {
      ...item,
      price,
      quantity,
      vat,
      customsCharge: isForeign ? customsCharge : undefined,
      total,
      rrp_date: rrpDate || new Date().toISOString(),
      currency: isForeign ? item.currency : 'NPR',
      forex_rate: isForeign ? item.forex_rate : 1,
    };

    setCart(prev => [...prev, cartItem]);
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditCartItem = (index: number) => {
    setSelectedItem(cart[index]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      showErrorToast({
        title: "Validation Error",
        message: "Please add at least one item to the cart",
        duration: 3000,
      });
      return;
    }

    try {
      const params = new URLSearchParams(searchParams);
      params.set('cart', encodeURIComponent(JSON.stringify(cart)));
      router.push(`/rrp/preview?${params.toString()}`);
    } catch (error) {
      console.error('Error submitting RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to submit RRP",
        duration: 3000,
      });
    }
  };

  const handleBack = () => {
    const currentParams = new URLSearchParams();
    
    // Preserve all existing parameters
    searchParams.forEach((value, key) => {
      currentParams.set(key, value);
    });
    
    // Ensure type parameter is included
    if (!currentParams.has('type')) {
      currentParams.set('type', rrpType || 'local');
    }

    // Preserve cart data
    if (cart.length > 0) {
      currentParams.set('cart', encodeURIComponent(JSON.stringify(cart)));
    }
    
    router.push(`/rrp/new?${currentParams.toString()}`);
  };

  if (isLoading || isConfigLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">RRP Items</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items Section */}
          <Card>
            <CardHeader>
              <CardTitle>Available Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Part Number</Label>
                    <Input
                      value={searchQueries.partNumber}
                      onChange={(e) => setSearchQueries(prev => ({ ...prev, partNumber: e.target.value }))}
                      placeholder="Search by part number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment Number</Label>
                    <Input
                      value={searchQueries.equipmentNumber}
                      onChange={(e) => setSearchQueries(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                      placeholder="Search by equipment number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Universal Search</Label>
                    <Input
                      value={searchQueries.universal}
                      onChange={(e) => setSearchQueries(prev => ({ ...prev, universal: e.target.value }))}
                      placeholder="Search by NAC code, item name, or request number"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Number</TableHead>
                        <TableHead>NAC Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Equipment Number</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onDoubleClick={() => handleItemDoubleClick(item)}
                        >
                          <TableCell>{item.request_number}</TableCell>
                          <TableCell>{item.nac_code}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={item.item_name}>{item.item_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell>{item.equipment_number}</TableCell>
                          <TableCell className="text-right">{item.received_quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Section */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Number</TableHead>
                        <TableHead>NAC Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Equipment Number</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        {rrpType === 'foreign' && (
                          <>
                            <TableHead className="text-right">Customs</TableHead>
                            <TableHead className="text-right">Forex</TableHead>
                            <TableHead>Currency</TableHead>
                          </>
                        )}
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>VAT</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.request_number}</TableCell>
                          <TableCell>{item.nac_code}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={item.item_name}>{item.item_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell>{item.equipment_number}</TableCell>
                          <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                          {rrpType === 'foreign' && (
                            <>
                              <TableCell className="text-right">{(item.customsCharge || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.forex_rate?.toFixed(2) || '-'}</TableCell>
                              <TableCell>{item.currency || '-'}</TableCell>
                            </>
                          )}
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.vat ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCartItem(index)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        {cart.length > 0 && (
          <div className="mt-6">
            <RRPPreview
              cart={cart}
              rrpDate={rrpDate || new Date().toISOString()}
              supplier={searchParams.get('supplier') || ''}
              inspectionUser={searchParams.get('inspectionUser') || ''}
              invoiceDate={searchParams.get('invoiceDate') || ''}
              invoiceNumber={searchParams.get('invoiceNumber') || ''}
              airwayBillNumber={searchParams.get('airwayBillNumber') || undefined}
              poNumber={searchParams.get('poNumber') || undefined}
              freightCharge={parseFloat(searchParams.get('freightCharge') || '0')}
              forexRate={parseFloat(searchParams.get('forexRate') || '1')}
              currency={searchParams.get('currency') || 'LKR'}
              onInvoiceDateChange={(date) => {
                if (date) {
                  const params = new URLSearchParams(searchParams);
                  params.set('invoiceDate', date.toISOString());
                  router.push(`/rrp/items?${params.toString()}`);
                }
              }}
              onInvoiceNumberChange={(value) => {
                const params = new URLSearchParams(searchParams);
                params.set('invoiceNumber', value);
                router.push(`/rrp/items?${params.toString()}`);
              }}
              onAirwayBillNumberChange={(value) => {
                const params = new URLSearchParams(searchParams);
                params.set('airwayBillNumber', value);
                router.push(`/rrp/items?${params.toString()}`);
              }}
              onPoNumberChange={(value) => {
                const params = new URLSearchParams(searchParams);
                params.set('poNumber', value);
                router.push(`/rrp/items?${params.toString()}`);
              }}
            />
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Edit Item' : 'Add Item'} ({rrpType === 'foreign' ? 'Foreign' : 'Local'} RRP)
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    defaultValue={selectedItem.price}
                    onChange={(e) => setSelectedItem({
                      ...selectedItem,
                      price: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={selectedItem.quantity}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedItem.vat}
                    onCheckedChange={(checked) => setSelectedItem({
                      ...selectedItem,
                      vat: checked
                    })}
                  />
                  <Label>Include VAT</Label>
                </div>
                {rrpType === 'foreign' && (
                  <>
                    <div className="space-y-2">
                      <Label>Customs Charge *</Label>
                      <Input
                        type="number"
                        defaultValue={selectedItem.customsCharge || 0}
                        onChange={(e) => setSelectedItem({
                          ...selectedItem,
                          customsCharge: parseFloat(e.target.value)
                        })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forex Rate</Label>
                      <Input
                        type="number"
                        defaultValue={selectedItem.forex_rate}
                        onChange={(e) => setSelectedItem({
                          ...selectedItem,
                          forex_rate: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={selectedItem.currency}
                        onValueChange={(value) => setSelectedItem({
                          ...selectedItem,
                          currency: value
                        })}
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
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedItem) {
                        if (rrpType === 'foreign' && (!selectedItem.customsCharge || selectedItem.customsCharge <= 0)) {
                          showErrorToast({
                            title: "Validation Error",
                            message: "Customs charge is required for foreign RRP",
                            duration: 3000,
                          });
                          return;
                        }
                        handleAddToCart(
                          selectedItem,
                          selectedItem.price,
                          selectedItem.quantity,
                          selectedItem.vat,
                          selectedItem.customsCharge
                        );
                      }
                    }}
                  >
                    {selectedItem ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 