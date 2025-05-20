'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRRP } from '@/hooks/useRRP';

interface RRPDates {
  rrpDate: Date | null;
  invoiceDate: Date | null;
  customsDate: Date | null;
}

export default function NewRRPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rrpType = searchParams.get('type') || 'local';
  const { showErrorToast } = useCustomToast();
  const { config, isLoading, getLocalSuppliers, getForeignSuppliers, getCurrencies } = useRRP();
  

  // Initialize state from URL parameters
  const [dates, setDates] = useState<RRPDates>({
    rrpDate: searchParams.get('rrpDate') ? new Date(searchParams.get('rrpDate')!) : null,
    invoiceDate: searchParams.get('invoiceDate') ? new Date(searchParams.get('invoiceDate')!) : null,
    customsDate: searchParams.get('customsDate') ? new Date(searchParams.get('customsDate')!) : null,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<string>(searchParams.get('supplier') || '');
  const [selectedInspectionUser, setSelectedInspectionUser] = useState<string>(searchParams.get('inspectionUser') || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(searchParams.get('invoiceNumber') || '');
  const [poNumber, setPoNumber] = useState<string>(searchParams.get('poNumber') || '');
  const [airwayBillNumber, setAirwayBillNumber] = useState<string>(searchParams.get('airwayBillNumber') || '');
  const [customsNumber, setCustomsNumber] = useState<string>(searchParams.get('customsNumber') || '');
  const [freightCharge, setFreightCharge] = useState<string>(searchParams.get('freightCharge') || '0');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(searchParams.get('currency') || '');
  const [forexRate, setForexRate] = useState<string>(searchParams.get('forexRate') || '');

  const handleDateChange = (field: keyof RRPDates, date: Date | null) => {
    setDates(prev => {
      const newDates = { ...prev, [field]: date };
      
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
    if (!dates.rrpDate || !dates.invoiceDate || !selectedSupplier || !invoiceNumber || !selectedInspectionUser) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields",
        duration: 3000,
      });
      return;
    }

    if (rrpType === 'foreign' && (!dates.customsDate || !poNumber || !airwayBillNumber || !selectedCurrency || !forexRate || !customsNumber)) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields for foreign RRP",
        duration: 3000,
      });
      return;
    }

    const queryParams = new URLSearchParams({
      type: rrpType || 'local',
      rrpDate: dates.rrpDate.toISOString(),
      invoiceDate: dates.invoiceDate.toISOString(),
      supplier: selectedSupplier,
      inspectionUser: selectedInspectionUser,
      invoiceNumber,
      ...(rrpType === 'foreign' && {
        customsDate: dates.customsDate?.toISOString() || '',
        poNumber,
        airwayBillNumber,
        customsNumber,
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
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl font-bold">
                Create New {rrpType === 'foreign' ? 'Foreign' : 'Local'} RRP
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RRP Date */}
              <div className="space-y-2">
                <Label>RRP Date *</Label>
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
                      value={dates.rrpDate || undefined}
                      onChange={(date: Date | null) => handleDateChange('rrpDate', date)}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
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
                      value={dates.invoiceDate || undefined}
                      onChange={(date: Date | null) => handleDateChange('invoiceDate', date)}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Customs Date (Foreign only) */}
              {rrpType === 'foreign' && (
                <div className="space-y-2">
                  <Label>Customs Date *</Label>
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
                        value={dates.customsDate || undefined}
                        onChange={(date: Date | null) => handleDateChange('customsDate', date)}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Supplier Selection */}
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rrpType === 'foreign' ? getForeignSuppliers() : getLocalSuppliers()).map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Inspection User Selection */}
              <div className="space-y-2">
                <Label>Inspection User *</Label>
                <Select value={selectedInspectionUser} onValueChange={setSelectedInspectionUser}>
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
              </div>

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
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
                    <Label>Customs Date *</Label>
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
                          value={dates.customsDate || undefined}
                          onChange={(date: Date | null) => handleDateChange('customsDate', date)}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Customs Number *</Label>
                    <Input
                      value={customsNumber}
                      onChange={(e) => setCustomsNumber(e.target.value)}
                      placeholder="Enter customs number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PO Number *</Label>
                    <Input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Enter PO number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Airway Bill Number *</Label>
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
                    <Label>Currency *</Label>
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
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

                  <div className="space-y-2">
                    <Label>Forex Rate *</Label>
                    <Input
                      type="number"
                      value={forexRate}
                      onChange={(e) => setForexRate(e.target.value)}
                      placeholder="Enter forex rate"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 