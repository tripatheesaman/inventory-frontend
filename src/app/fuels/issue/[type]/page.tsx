'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Search, ChevronsUpDown, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';

interface FuelRecord {
  equipment_number: string;
  kilometers: number;
  quantity: number;
  is_kilometer_reset: boolean;
}

interface FuelConfig {
  equipment_list: string[];
  equipment_kilometers: { [key: string]: number };
  latest_fuel_price?: number;
}

interface User {
  UserInfo: {
    username: string;
    name: string;
    permissions: string[];
    role_name: string;
  };
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export default function FuelIssueFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthContext() as AuthContextType;
  const type = params.type as string;
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<FuelRecord[]>([{ equipment_number: '', kilometers: 0, quantity: 0, is_kilometer_reset: false }]);
  const [config, setConfig] = useState<FuelConfig | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({});
  const [selectedIndices, setSelectedIndices] = useState<{ [key: number]: number }>({});
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const optionRefs = useRef<{ [key: number]: { [key: number]: HTMLDivElement | null } }>({});
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await API.get(`/api/fuel/config/${type}`);
        setConfig(response.data);
        setPrice(response.data.latest_fuel_price || 0);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load fuel configuration',
          variant: 'destructive',
        });
      }
    };
    fetchConfig();
  }, [type, toast]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    const suggestions = getFilteredSuggestions(index);
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const currentIndex = selectedIndices[index] ?? -1;
        const nextIndex = Math.min(currentIndex + 1, suggestions.length - 1);
        setSelectedIndices(prev => ({
          ...prev,
          [index]: nextIndex
        }));
        // Focus the next option
        if (optionRefs.current[index]?.[nextIndex]) {
          optionRefs.current[index][nextIndex]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        const currentIndexUp = selectedIndices[index] ?? 0;
        const prevIndex = Math.max(currentIndexUp - 1, 0);
        setSelectedIndices(prev => ({
          ...prev,
          [index]: prevIndex
        }));
        // Focus the previous option
        if (optionRefs.current[index]?.[prevIndex]) {
          optionRefs.current[index][prevIndex]?.focus();
        }
        break;
      case 'Enter':
        e.preventDefault();
        const selectedIndex = selectedIndices[index] ?? 0;
        if (suggestions[selectedIndex]) {
          handleSelect(index, suggestions[selectedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpenStates(prev => ({ ...prev, [index]: false }));
        setFocusedIndex(null);
        setIsSearchFocused(prev => ({ ...prev, [index]: false }));
        break;
    }
  };

  const handleAddRecord = () => {
    setRecords([...records, { equipment_number: '', kilometers: 0, quantity: 0, is_kilometer_reset: false }]);
  };

  const handleRemoveRecord = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleRecordChange = (index: number, field: keyof FuelRecord, value: string | number | boolean) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    
    // If equipment number changes, update kilometers
    if (field === 'equipment_number' && config) {
      newRecords[index].kilometers = config.equipment_kilometers[value as string] || 0;
    }
    
    setRecords(newRecords);
  };

  const getFilteredSuggestions = (index: number) => {
    if (!config?.equipment_list) return [];
    const query = inputValues[index]?.toLowerCase() || '';
    return config.equipment_list
      .filter(equipment => equipment.toLowerCase().includes(query))
      .map(equipment => ({
        value: equipment,
        label: equipment
      }));
  };

  const handleSelect = (index: number, value: string) => {
    handleRecordChange(index, 'equipment_number', value);
    setOpenStates(prev => ({ ...prev, [index]: false }));
    setInputValues(prev => ({ ...prev, [index]: '' }));
    setFocusedIndex(null);
    setIsSearchFocused(prev => ({ ...prev, [index]: false }));
  };

  const toggleOpen = (index: number) => {
    setOpenStates(prev => ({ ...prev, [index]: !prev[index] }));
    if (!openStates[index]) {
      // Reset selected index when opening
      setSelectedIndices(prev => ({ ...prev, [index]: -1 }));
      setFocusedIndex(null);
      // Focus the input after a short delay
      setTimeout(() => {
        inputRefs.current[index]?.focus();
      }, 0);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues(prev => ({ ...prev, [index]: value }));
    setFocusedIndex(null);
    setIsSearchFocused(prev => ({ ...prev, [index]: true }));
  };

  const validateRecords = () => {
    if (!date) return false;
    if (records.length === 0) return false;
    
    // Check for empty fields
    for (const record of records) {
      if (!record.equipment_number || record.kilometers === 0 || record.quantity === 0) {
        return false;
      }
    }

    // Check for duplicate equipment numbers on same date (except Cleaning)
    const equipmentNumbers = records.map(r => r.equipment_number);
    const uniqueNumbers = new Set(equipmentNumbers);
    if (type !== 'Cleaning' && equipmentNumbers.length !== uniqueNumbers.size) {
      return false;
    }

    // Check if kilometers are not less than previous
    for (const record of records) {
      if (config && record.kilometers < config.equipment_kilometers[record.equipment_number]) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateRecords()) {
      toast({
        title: 'Validation Error',
        description: 'Please check all fields and ensure no duplicate equipment numbers for the same date.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.UserInfo?.username) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add price to each record
      const recordsWithPrice = records.map(record => ({
        ...record,
        price: price
      }));

      const payload = {
        issue_date: format(date, 'yyyy-MM-dd'),
        issued_by: user.UserInfo.username,
        fuel_type: type,
        price: price,
        records: recordsWithPrice,
      };

      const response = await API.post('api/fuel/create', payload);

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Success',
          description: 'Fuel records created successfully',
        });
        router.push('/fuels/issue');
      } else {
        throw new Error(response.data?.message || 'Failed to create fuel records');
      }
    } catch (error: any) {
      console.error('Error creating fuel records:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to create fuel records',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#003594]">
          {type.charAt(0).toUpperCase() + type.slice(1)} Issue Form
        </h1>
        <p className="text-gray-500 mt-1">Fill in the details to issue {type}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[#003594]">Issue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      value={date}
                      onChange={(date: Date | null) => date && setDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Price per Liter</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="Enter price per liter"
                />
              </div>
            </div>

            <div className="space-y-4">
              {records.map((record, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Equipment Number</Label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openStates[index]}
                        className="w-full justify-between"
                        onClick={() => toggleOpen(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            toggleOpen(index);
                          }
                        }}
                      >
                        {record.equipment_number || "Select equipment..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      {openStates[index] && (
                        <div className="absolute w-full z-[9999] bg-white rounded-md border shadow-md mt-1">
                          <div className="w-full">
                            <div className="flex w-full items-center border-b px-3">
                              <input
                                ref={(el) => {
                                  inputRefs.current[index] = el;
                                }}
                                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search equipment..."
                                value={inputValues[index] || ''}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                autoComplete="off"
                              />
                            </div>
                            {getFilteredSuggestions(index).length === 0 ? (
                              <p className="p-4 text-sm text-center text-muted-foreground">
                                No equipment found.
                              </p>
                            ) : (
                              <div className="max-h-[200px] overflow-y-auto">
                                {getFilteredSuggestions(index).map((suggestion, suggestionIndex) => (
                                  <div
                                    key={suggestion.value}
                                    ref={(el) => {
                                      if (!optionRefs.current[index]) {
                                        optionRefs.current[index] = {};
                                      }
                                      optionRefs.current[index][suggestionIndex] = el;
                                    }}
                                    onClick={() => handleSelect(index, suggestion.value)}
                                    tabIndex={0}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={cn(
                                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
                                      "hover:bg-[#003594]/5 hover:text-[#003594]",
                                      record.equipment_number === suggestion.value && "bg-[#003594]/10 text-[#003594]",
                                      selectedIndices[index] === suggestionIndex && "bg-[#003594]/10 text-[#003594]"
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        (record.equipment_number === suggestion.value || selectedIndices[index] === suggestionIndex) ? "text-[#003594]" : "opacity-0"
                                      )}
                                    />
                                    {suggestion.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label>Kilometers</Label>
                    <Input
                      type="number"
                      value={record.kilometers}
                      onChange={(e) => handleRecordChange(index, 'kilometers', Number(e.target.value))}
                      min={config?.equipment_kilometers[record.equipment_number] || 0}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Quantity (Liters)</Label>
                    <Input
                      type="number"
                      value={record.quantity}
                      onChange={(e) => handleRecordChange(index, 'quantity', Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRecord();
                        }
                      }}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecord(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleAddRecord}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#003594] hover:bg-[#002a7a]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 