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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check flight count',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Diesel Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white"
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
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white"
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
              className="w-full"
            >
              {isLoading ? 'Generating Report...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Enter Number of Flights</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Number of Flights</Label>
            <Input
              type="number"
              value={flightCount}
              onChange={(e) => setFlightCount(Number(e.target.value))}
              placeholder="Enter number of flights"
              min="0"
              className="bg-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlightDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlightCountSubmit}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 