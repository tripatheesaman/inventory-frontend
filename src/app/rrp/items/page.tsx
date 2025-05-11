'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Trash2, Edit2 } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface RRPItem {
  id: number;
  partNumber: string;
  equipmentNumber: string;
  description: string;
  unit: string;
  price: number;
  quantity: number;
  vat: boolean;
  customsCharge?: number;
}

interface CartItem extends RRPItem {
  total: number;
}

export default function RRPItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<RRPItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RRPItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RRPItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const rrpType = searchParams.get('type');

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
  }, [showErrorToast]);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.equipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const handleItemDoubleClick = (item: RRPItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleAddToCart = (item: RRPItem, price: number, quantity: number, vat: boolean, customsCharge?: number) => {
    const total = price * quantity * (vat ? 1.15 : 1) + (customsCharge || 0);
    const cartItem: CartItem = {
      ...item,
      price,
      quantity,
      vat,
      customsCharge,
      total,
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
      const rrpData = {
        type: rrpType,
        ...Object.fromEntries(searchParams.entries()),
        items: cart,
      };

      await API.post('/api/rrp', rrpData);
      router.push('/rrp/preview');
    } catch (error) {
      console.error('Error submitting RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to submit RRP",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Available Items</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number or equipment number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onDoubleClick={() => handleItemDoubleClick(item)}
                    >
                      <TableCell>{item.partNumber}</TableCell>
                      <TableCell>{item.equipmentNumber}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>VAT</TableHead>
                    {rrpType === 'foreign' && <TableHead>Customs</TableHead>}
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.partNumber}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.vat ? 'Yes' : 'No'}</TableCell>
                      {rrpType === 'foreign' && (
                        <TableCell>{item.customsCharge || 0}</TableCell>
                      )}
                      <TableCell>{item.total}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
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
            <div className="flex justify-end space-x-4 mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit Item' : 'Add Item'}
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
                  defaultValue={selectedItem.quantity}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem,
                    quantity: parseInt(e.target.value)
                  })}
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
                <div className="space-y-2">
                  <Label>Customs Charge</Label>
                  <Input
                    type="number"
                    defaultValue={selectedItem.customsCharge}
                    onChange={(e) => setSelectedItem({
                      ...selectedItem,
                      customsCharge: parseFloat(e.target.value)
                    })}
                  />
                </div>
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
  );
} 