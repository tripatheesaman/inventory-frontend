'use client';

import { useState } from 'react';
import { SearchControls, SearchResults } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { X, Check, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/utils';

interface SelectedItem {
  id: number;
  naccode: string;
  name: string;
}

export default function StockCardPage() {
  const { toast } = useToast();
  const { permissions } = useAuthContext();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [generateByIssueDate, setGenerateByIssueDate] = useState(false);

  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
  } = useSearch();

  const handleRowClick = (item: any) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, {
        id: item.id,
        naccode: item.nacCode,
        name: item.itemName
      }]);
    }
  };

  const removeSelectedItem = (id: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleGenerateStockCard = async () => {
    if (!generateByIssueDate && selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item",
        variant: "destructive",
      });
      return;
    }

    if (generateByIssueDate && (!fromDate || !toDate)) {
      toast({
        title: "Error",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const payload = generateByIssueDate 
        ? {
            fromDate: format(startOfDay(fromDate!), 'yyyy-MM-dd'),
            toDate: format(startOfDay(toDate!), 'yyyy-MM-dd'),
            generateByIssueDate: true
          }
        : {
            naccodes: selectedItems.map(item => item.naccode),
            fromDate: fromDate ? format(startOfDay(fromDate), 'yyyy-MM-dd') : undefined,
            toDate: toDate ? format(startOfDay(toDate), 'yyyy-MM-dd') : undefined,
            generateByIssueDate: false
          };
      const response = await API.post('/api/report/stockcard', payload, {
        responseType: 'blob'
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
      link.download = `stock-cards-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Stock cards generated successfully",
      });
      setSelectedItems([]);
      setFromDate(undefined);
      setToDate(undefined);
    } catch (error) {
      console.error('Error generating stock cards:', error);
      toast({
        title: "Error",
        description: "Failed to generate stock cards",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
                Stock Card Generation
              </h1>
              <p className="text-gray-600 mt-1">
                {generateByIssueDate 
                  ? "Select date range to generate stock cards for items issued within that period"
                  : "Click on items to select them for stock card generation"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="generate-by-issue-date"
                checked={generateByIssueDate}
                onCheckedChange={setGenerateByIssueDate}
              />
              <Label htmlFor="generate-by-issue-date">Generate by Issue Date</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#002a6e]/10 focus:ring-[#003594]",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      value={fromDate}
                      onChange={(date) => setFromDate(date || undefined)}
                      className="rounded-md border border-[#002a6e]/10"
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
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#002a6e]/10 focus:ring-[#003594]",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      value={toDate}
                      onChange={(date) => setToDate(date || undefined)}
                      className="rounded-md border border-[#002a6e]/10"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {!generateByIssueDate && (
              <SearchControls
                onUniversalSearch={handleSearch('universal')}
                onEquipmentSearch={handleSearch('equipmentNumber')}
                onPartSearch={handleSearch('partNumber')}
              />
            )}
          </div>

          {!generateByIssueDate && (
            <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6 hover:border-[#d2293b]/20 transition-colors">
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#003594] border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#002a6e]/10">
                    <thead>
                      <tr className="bg-[#003594]/5">
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[50px]">
                          Select
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
                          NAC Code
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[120px]">
                          Part Number
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider min-w-[200px]">
                          Item Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider w-[100px]">
                          Current Balance
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#003594] uppercase tracking-wider min-w-[150px]">
                          Equipment Number
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#002a6e]/10">
                      {results?.map((item) => {
                        const isSelected = selectedItems.some(selected => selected.id === item.id);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className="hover:bg-[#003594]/5 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center">
                                {isSelected ? (
                                  <div className="h-5 w-5 rounded-full bg-[#003594] flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-[#003594]" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-[#003594]">
                                {item.nacCode}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 break-words">
                                {item.partNumber}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 break-words">
                                {item.itemName}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-center font-medium text-[#003594]">
                                {item.currentBalance}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 break-words">
                                {item.equipmentNumber}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-[#002a6e]/10 p-6">
            {!generateByIssueDate && selectedItems.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-[#003594] mb-4">Selected Items ({selectedItems.length})</h2>
                <div className="space-y-2 mb-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{item.naccode}</span>
                        <span className="text-gray-600 ml-2">{item.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              onClick={handleGenerateStockCard}
              disabled={isGenerating || (generateByIssueDate ? (!fromDate || !toDate) : selectedItems.length === 0)}
              className="w-full bg-[#003594] hover:bg-[#003594]/90 text-white"
            >
              {isGenerating ? "Generating..." : "Generate Stock Cards"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 