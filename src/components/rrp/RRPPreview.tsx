'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRRP } from '@/hooks/useRRP';

interface RRPPreviewProps {
  cart: CartItem[];
  rrpDate: string;
  supplier: string;
  invoiceDate: string;
  invoiceNumber: string;
  airwayBillNumber?: string;
  poNumber?: string;
  freightCharge: number;
  forexRate: number;
  currency: string;
  onInvoiceDateChange: (date: Date | null) => void;
  onInvoiceNumberChange: (value: string) => void;
  onAirwayBillNumberChange: (value: string) => void;
  onPoNumberChange: (value: string) => void;
}

interface CartItem {
  id: number;
  request_number: string;
  request_date: string;
  nac_code: string;
  item_name: string;
  part_number: string;
  equipment_number: string;
  quantity: number;
  unit: string;
  price: number;
  vat: boolean;
  customsCharge?: number;
}

export default function RRPPreview({
  cart,
  rrpDate,
  supplier,
  invoiceDate,
  invoiceNumber,
  airwayBillNumber,
  poNumber,
  freightCharge,
  forexRate,
  currency,
  onInvoiceDateChange,
  onInvoiceNumberChange,
  onAirwayBillNumberChange,
  onPoNumberChange,
}: RRPPreviewProps) {
  const { config } = useRRP();
  const vatRate = 15; // Hardcoded VAT rate of 15%

  // Calculate totals and distribute freight charge
  const calculateTotals = () => {
    const totalItemPrice = cart.reduce((sum, item) => sum + (item.price * forexRate), 0);
    const freightChargePerItem = totalItemPrice > 0 
      ? cart.map(item => (item.price * forexRate / totalItemPrice) * freightCharge)
      : cart.map(() => freightCharge / cart.length);

    const rows = cart.map((item, index) => {
      const itemPrice = item.price * forexRate;
      const itemFreightCharge = freightChargePerItem[index];
      const itemCustomsCharge = item.customsCharge || 0;
      const itemVat = item.vat ? (itemPrice + itemFreightCharge + itemCustomsCharge) * (vatRate / 100) : 0;
      const total = itemPrice + itemFreightCharge + itemCustomsCharge + itemVat;

      return {
        ...item,
        itemPrice,
        itemFreightCharge,
        itemCustomsCharge,
        itemVat,
        total,
      };
    });

    const totals = rows.reduce((acc, row) => ({
      itemPrice: acc.itemPrice + row.itemPrice,
      freightCharge: acc.freightCharge + row.itemFreightCharge,
      customsCharge: acc.customsCharge + row.itemCustomsCharge,
      vat: acc.vat + row.itemVat,
      total: acc.total + row.total,
    }), {
      itemPrice: 0,
      freightCharge: 0,
      customsCharge: 0,
      vat: 0,
      total: 0,
    });

    return { rows, totals };
  };

  const { rows, totals } = calculateTotals();

  // Get unique request numbers and dates
  const requestNumbers = [...new Set(cart.map(item => item.request_number))].join(', ');
  const requestDates = [...new Set(cart.map(item => item.request_date))].join(', ');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">RRP Preview</CardTitle>
              <div className="mt-2 space-y-1">
                <p><span className="font-semibold">RRP Date:</span> {new Date(rrpDate).toLocaleDateString()}</p>
                <p><span className="font-semibold">Supplier:</span> {supplier}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAC Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Item Price</TableHead>
                <TableHead className="text-right">Customs Charge</TableHead>
                <TableHead className="text-right">Freight Charge</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.nac_code}</TableCell>
                  <TableCell>{row.item_name}</TableCell>
                  <TableCell>{row.part_number}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell className="text-right">{row.itemPrice.toFixed(2)} {currency}</TableCell>
                  <TableCell className="text-right">{row.itemCustomsCharge.toFixed(2)} {currency}</TableCell>
                  <TableCell className="text-right">{row.itemFreightCharge.toFixed(2)} {currency}</TableCell>
                  <TableCell className="text-right">{row.itemVat.toFixed(2)} {currency}</TableCell>
                  <TableCell className="text-right">{row.total.toFixed(2)} {currency}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right">{totals.itemPrice.toFixed(2)} {currency}</TableCell>
                <TableCell className="text-right">{totals.customsCharge.toFixed(2)} {currency}</TableCell>
                <TableCell className="text-right">{totals.freightCharge.toFixed(2)} {currency}</TableCell>
                <TableCell className="text-right">{totals.vat.toFixed(2)} {currency}</TableCell>
                <TableCell className="text-right">{totals.total.toFixed(2)} {currency}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(new Date(invoiceDate), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      value={invoiceDate ? new Date(invoiceDate) : undefined}
                      onChange={onInvoiceDateChange}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => onInvoiceNumberChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Request Numbers</Label>
                <Input value={requestNumbers} disabled />
              </div>

              <div className="space-y-2">
                <Label>Request Dates</Label>
                <Input value={requestDates} disabled />
              </div>
            </div>

            <div className="space-y-4">
              {airwayBillNumber !== undefined && (
                <div className="space-y-2">
                  <Label>Airway Bill Number</Label>
                  <Input
                    value={airwayBillNumber}
                    onChange={(e) => onAirwayBillNumberChange(e.target.value)}
                  />
                </div>
              )}

              {poNumber !== undefined && (
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => onPoNumberChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 