'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RRPConfig {
  rrpTypes: string[];
  suppliers: string[];
  currencies: string[];
  lastRRPDate: string;
}

interface RRPDates {
  rrpDate: Date | null;
  invoiceDate: Date | null;
  customsDate: Date | null;
}

export default function NewRRPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rrpType = searchParams.get('type');
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<RRPConfig | null>(null);
  const [dates, setDates] = useState<RRPDates>({
    rrpDate: null,
    invoiceDate: null,
    customsDate: null,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [airwayBillNumber, setAirwayBillNumber] = useState<string>('');
  const [freightCharge, setFreightCharge] = useState<string>('0');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [forexRate, setForexRate] = useState<string>('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await API.get('/api/rrp/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Error fetching RRP config:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP configuration",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [showErrorToast]);

  const handleDateChange = (field: keyof RRPDates, date: Date | null) => {
    setDates(prev => {
      const newDates = { ...prev, [field]: date };
      
      // Validate dates
      if (field === 'rrpDate' && date) {
        if (newDates.invoiceDate && newDates.invoiceDate > date) {
          newDates.invoiceDate = null;
        }
        if (newDates.customsDate && newDates.customsDate > date) {
          newDates.customsDate = null;
        }
      }
      
      return newDates;
    });
  };

  const handleNext = () => {
    if (!dates.rrpDate || !dates.invoiceDate || !selectedSupplier || !invoiceNumber) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields",
        duration: 3000,
      });
      return;
    }

    if (rrpType === 'foreign' && (!dates.customsDate || !poNumber || !airwayBillNumber || !selectedCurrency || !forexRate)) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields for foreign RRP",
        duration: 3000,
      });
      return;
    }

    // Navigate to items selection page with all the data
    const queryParams = new URLSearchParams({
      type: rrpType || '',
      rrpDate: dates.rrpDate.toISOString(),
      invoiceDate: dates.invoiceDate.toISOString(),
      supplier: selectedSupplier,
      invoiceNumber,
      ...(rrpType === 'foreign' && {
        customsDate: dates.customsDate?.toISOString() || '',
        poNumber,
        airwayBillNumber,
        freightCharge,
        currency: selectedCurrency,
        forexRate,
      }),
    });

    router.push(`/rrp/items?${queryParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New {rrpType === 'foreign' ? 'Foreign' : 'Local'} RRP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* RRP Date */}
            <div className="space-y-2">
              <Label>RRP Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dates.rrpDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.rrpDate ? format(dates.rrpDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dates.rrpDate || undefined}
                    onSelect={(date) => handleDateChange('rrpDate', date)}
                    disabled={(date) => date < new Date(config.lastRRPDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Invoice Date */}
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dates.invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.invoiceDate ? format(dates.invoiceDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dates.invoiceDate || undefined}
                    onSelect={(date) => handleDateChange('invoiceDate', date)}
                    disabled={(date) => dates.rrpDate ? date > dates.rrpDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Customs Date (Foreign only) */}
            {rrpType === 'foreign' && (
              <div className="space-y-2">
                <Label>Customs Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dates.customsDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dates.customsDate ? format(dates.customsDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dates.customsDate || undefined}
                      onSelect={(date) => handleDateChange('customsDate', date)}
                      disabled={(date) => dates.rrpDate ? date > dates.rrpDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {config.suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>

            {/* Foreign RRP specific fields */}
            {rrpType === 'foreign' && (
              <>
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Airway Bill Number</Label>
                  <Input
                    value={airwayBillNumber}
                    onChange={(e) => setAirwayBillNumber(e.target.value)}
                    placeholder="Enter airway bill number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Freight Charge</Label>
                  <Input
                    type="number"
                    value={freightCharge}
                    onChange={(e) => setFreightCharge(e.target.value)}
                    placeholder="Enter freight charge"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Forex Rate</Label>
                  <Input
                    type="number"
                    value={forexRate}
                    onChange={(e) => setForexRate(e.target.value)}
                    placeholder="Enter forex rate"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 