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
import { API } from '@/lib/api';

interface RRPDates {
  rrpDate: Date | null;
  invoiceDate: Date | null;
}

export default function NewRRPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rrpType = searchParams.get('type') || 'local';
  const { showErrorToast, showSuccessToast } = useCustomToast();
  const { config, isLoading, getLocalSuppliers, getForeignSuppliers, getCurrencies } = useRRP();
  const [isVerifying, setIsVerifying] = useState(false);
  const [previousRRPDate, setPreviousRRPDate] = useState<Date | null>(null);
  const [isNewRRP, setIsNewRRP] = useState(false);

  // Initialize state from URL parameters
  const [dates, setDates] = useState<RRPDates>({
    rrpDate: searchParams.get('rrpDate') ? new Date(searchParams.get('rrpDate')!) : null,
    invoiceDate: searchParams.get('invoiceDate') ? new Date(searchParams.get('invoiceDate')!) : null,
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
  const [rrpNumber, setRrpNumber] = useState<string>(searchParams.get('rrpNumber') || '');

  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestRRPDetails = async () => {
      try {
        const response = await API.get(`/api/rrp/getlatestrrpdetails/${rrpType}`);

        if (response.status === 200) {
          const data = response.data;
          if (data.rrpDate) {
            setPreviousRRPDate(new Date(data.rrpDate));
          }
        }
      } catch (error) {
        console.error('Error fetching latest RRP details:', error);
      }
    };

    fetchLatestRRPDetails();
  }, [rrpType]);

  useEffect(() => {
    if (dateError) {
      showErrorToast({
        title: "Invalid Date",
        message: dateError,
        duration: 3000,
      });
      setDateError(null);
    }
  }, [dateError, showErrorToast]);

  const handleDateChange = (field: keyof RRPDates, date: Date | null) => {
    setDates(prev => {
      const newDates = { ...prev, [field]: date };
      
      // Handle RRP date changes
      if (field === 'rrpDate' && date) {
        // For new RRP, check against previous RRP date
        if (isNewRRP && previousRRPDate && date < previousRRPDate) {
          setDateError("RRP date cannot be less than the previous RRP date");
          return prev;
        }

        // Reset invoice and customs dates when RRP date changes
        newDates.invoiceDate = null;
      }
      
      // Handle invoice date changes
      if (field === 'invoiceDate' && date) {
        if (newDates.rrpDate && date > newDates.rrpDate) {
          setDateError("Invoice date cannot be greater than RRP date");
          return prev;
        }
      }
      
      return newDates;
    });
  };

  const handleNext = async () => {
    if (!dates.rrpDate || !dates.invoiceDate || !selectedSupplier || !invoiceNumber || !selectedInspectionUser || !rrpNumber) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields",
        duration: 3000,
      });
      return;
    }

    if (rrpType === 'foreign' && (!poNumber || !airwayBillNumber || !selectedCurrency || !forexRate || !customsNumber)) {
      showErrorToast({
        title: "Validation Error",
        message: "Please fill in all required fields for foreign RRP",
        duration: 3000,
      });
      return;
    }

    try {
      setIsVerifying(true);
      const response = await API.get(`/api/rrp/verifyRRPNumber/${rrpNumber}`);
      
      if (response.status === 200) {
        const responseData = response.data;
        
        // Check if it's a new RRP (empty response)
        const isEmptyResponse = Object.keys(responseData).length === 0;
        
        if (isEmptyResponse) {
          // It's a new RRP, check the date
          if (previousRRPDate && dates.rrpDate < previousRRPDate) {
            setDateError("RRP date cannot be less than the previous RRP date");
            return;
          }
        } else {
          // It's an old RRP, update the number
          setRrpNumber(responseData.rrpNumber);
        }

        // Additional validation for invoice date
        if (dates.invoiceDate && dates.rrpDate && dates.invoiceDate > dates.rrpDate) {
          setDateError("Invoice date cannot be greater than RRP date");
          return;
        }

        const queryParams = new URLSearchParams({
          type: rrpType || 'local',
          rrpDate: dates.rrpDate.toISOString(),
          invoiceDate: dates.invoiceDate.toISOString(),
          supplier: selectedSupplier,
          inspectionUser: selectedInspectionUser,
          invoiceNumber,
          rrpNumber: responseData.rrpNumber || rrpNumber,
          ...(rrpType === 'foreign' && {
            poNumber,
            airwayBillNumber,
            customsNumber,
            freightCharge,
            currency: selectedCurrency,
            forexRate,
          }),
        });

        router.push(`/rrp/items?${queryParams.toString()}`);
      } else {
        showErrorToast({
          title: "Invalid RRP Number",
          message: "The RRP number is not valid",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error verifying RRP number:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to verify RRP number",
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#003594]" />
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/rrp')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
                Create New {rrpType === 'local' ? 'Local' : 'Foreign'} RRP
              </h1>
              <p className="text-gray-600 mt-1">Enter the RRP details</p>
            </div>
          </div>

          <Card className="border-[#002a6e]/10 hover:border-[#d2293b]/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RRP Number */}
                <div className="space-y-2">
                  <Label>RRP Number *</Label>
                  <Input
                    value={rrpNumber}
                    onChange={(e) => setRrpNumber(e.target.value)}
                    placeholder="Enter RRP number"
                    className="w-full border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20"
                  />
                </div>

                {/* RRP Date */}
                <div className="space-y-2">
                  <Label>RRP Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-[#002a6e]/10 hover:border-[#003594] hover:bg-[#003594]/5",
                          !dates.rrpDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dates.rrpDate ? format(dates.rrpDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white">
                      <Calendar
                        value={dates.rrpDate || undefined}
                        onChange={(date: Date | null) => handleDateChange('rrpDate', date)}
                        className="rounded-md border border-[#002a6e]/10"
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
                          "w-full justify-start text-left font-normal border-[#002a6e]/10 hover:border-[#003594] hover:bg-[#003594]/5",
                          !dates.invoiceDate && "text-muted-foreground"
                        )}
                        disabled={!dates.rrpDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dates.invoiceDate ? format(dates.invoiceDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white">
                      <Calendar
                        value={dates.invoiceDate || undefined}
                        onChange={(date: Date | null) => handleDateChange('invoiceDate', date)}
                        className="rounded-md border border-[#002a6e]/10"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="bg-white border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#002a6e]/10">
                      {(rrpType === 'foreign' ? getForeignSuppliers() : getLocalSuppliers()).map((supplier) => (
                        <SelectItem key={supplier} value={supplier} className="focus:bg-[#003594]/5">
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
                    <SelectTrigger className="bg-white border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20">
                      <SelectValue placeholder="Select inspection user" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#002a6e]/10">
                      {config.inspection_user_details.map((user) => (
                        <SelectItem key={user.name} value={`${user.name},${user.designation}`} className="focus:bg-[#003594]/5">
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
                    className="border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20"
                  />
                </div>

                {/* Foreign RRP specific fields */}
                {rrpType === 'foreign' && (
                  <>
                    <div className="space-y-2">
                      <Label>Customs Number *</Label>
                      <Input
                        value={customsNumber}
                        onChange={(e) => setCustomsNumber(e.target.value)}
                        placeholder="Enter customs number"
                        className="border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PO Number *</Label>
                      <Input
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="Enter PO number"
                        className="border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Airway Bill Number *</Label>
                      <Input
                        value={airwayBillNumber}
                        onChange={(e) => setAirwayBillNumber(e.target.value)}
                        placeholder="Enter airway bill number"
                        className="border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="border-[#d2293b]/20 hover:border-[#d2293b] hover:bg-[#d2293b]/5 bg-[#d2293b] text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleNext}
                  className="bg-[#003594] hover:bg-[#002a6e] text-white"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 