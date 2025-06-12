'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface FuelRecord {
  equipment_number: string;
  kilometers: number;
  quantity: number;
  is_kilometer_reset: boolean;
}

interface FuelConfig {
  equipment_list: string[];
  equipment_kilometers: { [key: string]: number };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  // Add other auth context properties as needed
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await API.get(`/api/fuel/config/${type}`);
        setConfig(response.data);
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

    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post('/fuels/records', {
        issue_date: format(date, 'yyyy-MM-dd'),
        issued_by: user.id,
        fuel_type: type,
        records: records,
      });

      toast({
        title: 'Success',
        description: 'Fuel records created successfully',
      });
      router.push('/fuels/issue');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create fuel records',
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
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Label>Issue Date</Label>
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
          </div>

          <div className="space-y-4">
            {records.map((record, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Equipment Number</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {record.equipment_number || "Select equipment"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-white">
                      <Command className="bg-white">
                        <CommandInput placeholder="Search equipment..." className="border-none focus:ring-0" />
                        <CommandEmpty>No equipment found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {config?.equipment_list.map((equipment) => (
                            <CommandItem
                              key={equipment}
                              value={equipment}
                              onSelect={() => handleRecordChange(index, 'equipment_number', equipment)}
                              className="cursor-pointer hover:bg-[#003594]/5"
                            >
                              {equipment}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
        </CardContent>
      </Card>
    </div>
  );
} 