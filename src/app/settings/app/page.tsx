'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useAuthContext } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function AppSettingsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { permissions } = useAuthContext();
  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current fiscal year on component mount
  useEffect(() => {
    const fetchFiscalYear = async () => {
      try {
        const response = await API.get('/api/settings/fiscal-year');
        if (response.status === 200) {
          setFiscalYear(response.data.fiscalYear);
        }
      } catch (error) {
        console.error('Error fetching fiscal year:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch current fiscal year",
          duration: 3000,
        });
      }
    };

    fetchFiscalYear();
  }, []);

  const handleSave = async () => {
    if (!permissions?.includes('can_change_fy')) {
      showErrorToast({
        title: "Access Denied",
        message: "You don't have permission to change fiscal year",
        duration: 3000,
      });
      return;
    }

    // Validate fiscal year format (e.g., 2081/82)
    const fiscalYearRegex = /^\d{4}\/\d{2}$/;
    if (!fiscalYearRegex.test(fiscalYear)) {
      showErrorToast({
        title: "Invalid Format",
        message: "Fiscal year must be in format YYYY/YY (e.g., 2081/82)",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await API.put('/api/settings/fiscal-year', {
        fiscalYear
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Fiscal year updated successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating fiscal year:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update fiscal year",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Input
                id="fiscalYear"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="e.g., 2081/82"
                disabled={!permissions?.includes('can_change_fy')}
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">
                Enter fiscal year in format YYYY/YY (e.g., 2081/82)
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading || !permissions?.includes('can_change_fy')}
                className="bg-[#003594] text-white hover:bg-[#002a6e]"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 