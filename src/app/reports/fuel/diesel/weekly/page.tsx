'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { API } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Spinner, ContentSpinner } from '@/components/ui/spinner';

export default function WeeklyDieselReportPage() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showFlightDialog, setShowFlightDialog] = useState(false);
  const [flightCount, setFlightCount] = useState<number>(0);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if flight count exists for the date range
      const checkResponse = await API.get('/api/fuel/reports/diesel/weekly/check', {
        params: {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        }
      });

      if (checkResponse.data.has_flight_count) {
        // If flight count exists, generate report directly
        await generateReport();
      } else {
        // If no flight count, show dialog to enter flight count
        setShowFlightDialog(true);
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to check flight count';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: unknown }).response !== null
      ) {
        const response = (error as { response?: unknown }).response;
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data?: unknown }).data === 'object' &&
          (response as { data?: unknown }).data !== null
        ) {
          const data = (response as { data?: unknown }).data;
          if (
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof (data as { message?: unknown }).message === 'string'
          ) {
            errorMessage = (data as { message: string }).message;
          }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (flightCount?: number) => {
    try {
      const response = await API.get('/api/fuel/reports/diesel/weekly', {
        params: {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          flight_count: flightCount
        },
        responseType: 'blob' // Important for file download
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Set the file name
      const fileName = `diesel_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;
      link.setAttribute('download', fileName);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error: unknown) {
      let errorMessage = 'Failed to generate report';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: unknown }).response !== null
      ) {
        const response = (error as { response?: unknown }).response;
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data?: unknown }).data === 'object' &&
          (response as { data?: unknown }).data !== null
        ) {
          const data = (response as { data?: unknown }).data;
          if (
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof (data as { message?: unknown }).message === 'string'
          ) {
            errorMessage = (data as { message: string }).message;
          }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleFlightCountSubmit = async () => {
    if (flightCount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid flight count',
        variant: 'destructive',
      });
      return;
    }

    setShowFlightDialog(false);
    await generateReport(flightCount);
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg rounded-xl border border-gray-200 bg-white max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#003594]">Weekly Diesel Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[#003594] font-semibold">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-[#003594] text-[#003594] hover:bg-[#003594] hover:text-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                      value={startDate}
                      onChange={(date: Date | null) => date && setStartDate(date)}
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-[#003594] font-semibold">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-[#003594] text-[#003594] hover:bg-[#003594] hover:text-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                      value={endDate}
                      onChange={(date: Date | null) => date && setEndDate(date)}
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button 
              onClick={handleGenerateReport} 
              disabled={isLoading}
              className="w-full bg-[#003594] text-white font-semibold hover:bg-[#d2293b] transition-colors"
            >
              {isLoading ? <Spinner size="sm" variant="white" className="mr-2" /> : null}
              {isLoading ? 'Generating Report...' : 'Generate Report'}
            </Button>
            {isLoading && <ContentSpinner />}
          </div>
        </CardContent>
      </Card>
      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#003594]">Enter Number of Flights</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-[#003594] font-semibold">Number of Flights</Label>
            <Input
              type="number"
              value={flightCount}
              onChange={(e) => setFlightCount(Number(e.target.value))}
              placeholder="Enter number of flights"
              min="0"
              className="bg-white border-[#003594]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlightDialog(false)} className="border-[#003594] text-[#003594] hover:bg-[#003594] hover:text-white">Cancel</Button>
            <Button onClick={handleFlightCountSubmit} className="bg-[#003594] text-white font-semibold hover:bg-[#d2293b] transition-colors">
              {isLoading ? <Spinner size="sm" variant="white" className="mr-2" /> : null}
              Generate Report
            </Button>
          </DialogFooter>
          {isLoading && <ContentSpinner />}
        </DialogContent>
      </Dialog>
    </div>
  );
} 