'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomToast } from '@/components/ui/custom-toast';

export default function IssueSettingsPage() {
  const { showSuccessToast } = useCustomToast();

  const handleSave = () => {
    // TODO: Implement save functionality
    showSuccessToast({
      title: "Success",
      message: "Issue settings saved successfully",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add your issue settings form fields here */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSave}
              className="bg-[#003594] text-white hover:bg-[#002a6e]"
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 