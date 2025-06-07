'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useAuthContext } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API } from '@/lib/api';
import { useState, useEffect } from 'react';

interface AuthorityDetails {
  id: number;
  authority_type: string;
  level_1_authority_name: string;
  level_1_authority_staffid: string;
  level_1_authority_designation: string;
  level_2_authority_name: string;
  level_2_authority_staffid: string;
  level_2_authority_designation: string;
  level_3_authority_name: string;
  level_3_authority_staffid: string;
  level_3_authority_designation: string;
  quality_check_authority_name: string;
  quality_check_authority_staffid: string;
  quality_check_authority_designation: string;
}

export default function RequestSettingsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { permissions } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [authorityDetails, setAuthorityDetails] = useState<AuthorityDetails[]>([]);

  useEffect(() => {
    const fetchAuthorityDetails = async () => {
      try {
        const response = await API.get('/api/settings/request/authority-details');
        if (response.status === 200) {
          setAuthorityDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching authority details:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch authority details",
          duration: 3000,
        });
      }
    };

    fetchAuthorityDetails();
  }, []);

  const handleSave = async () => {
    if (!permissions?.includes('can_edit_request_authority_details')) {
      showErrorToast({
        title: "Access Denied",
        message: "You don't have permission to edit authority details",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await API.put('/api/settings/request/authority-details', {
        authorityDetails
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Authority details updated successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating authority details:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update authority details",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorityChange = (id: number, field: keyof AuthorityDetails, value: string) => {
    setAuthorityDetails(prev => 
      prev.map(auth => 
        auth.id === id ? { ...auth, [field]: value } : auth
      )
    );
  };

  const addNewAuthority = () => {
    const newAuthority: AuthorityDetails = {
      id: Date.now(), // Temporary ID for new entries
      authority_type: '',
      level_1_authority_name: '',
      level_1_authority_staffid: '',
      level_1_authority_designation: '',
      level_2_authority_name: '',
      level_2_authority_staffid: '',
      level_2_authority_designation: '',
      level_3_authority_name: '',
      level_3_authority_staffid: '',
      level_3_authority_designation: '',
      quality_check_authority_name: '',
      quality_check_authority_staffid: '',
      quality_check_authority_designation: ''
    };
    setAuthorityDetails(prev => [...prev, newAuthority]);
  };

  const removeAuthority = (id: number) => {
    setAuthorityDetails(prev => prev.filter(auth => auth.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Authority Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {authorityDetails.map((auth, index) => (
              <div key={auth.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Authority Set {index + 1}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Authority Type</Label>
                    <Input
                      value={auth.authority_type ?? ''}
                      onChange={(e) => handleAuthorityChange(auth.id, 'authority_type', e.target.value)}
                      placeholder="Enter authority type"
                      disabled
                    />
                  </div>

                  {/* Level 1 Authority */}
                  <div className="col-span-2">
                    <h4 className="font-medium mb-2">Level 1 Authority</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={auth.level_1_authority_name ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_1_authority_name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Staff ID</Label>
                        <Input
                          value={auth.level_1_authority_staffid ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_1_authority_staffid', e.target.value)}
                          placeholder="Enter staff ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={auth.level_1_authority_designation ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_1_authority_designation', e.target.value)}
                          placeholder="Enter designation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level 2 Authority */}
                  <div className="col-span-2">
                    <h4 className="font-medium mb-2">Level 2 Authority</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={auth.level_2_authority_name ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_2_authority_name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Staff ID</Label>
                        <Input
                          value={auth.level_2_authority_staffid ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_2_authority_staffid', e.target.value)}
                          placeholder="Enter staff ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={auth.level_2_authority_designation ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_2_authority_designation', e.target.value)}
                          placeholder="Enter designation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Level 3 Authority */}
                  <div className="col-span-2">
                    <h4 className="font-medium mb-2">Level 3 Authority</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={auth.level_3_authority_name ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_3_authority_name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Staff ID</Label>
                        <Input
                          value={auth.level_3_authority_staffid ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_3_authority_staffid', e.target.value)}
                          placeholder="Enter staff ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={auth.level_3_authority_designation ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'level_3_authority_designation', e.target.value)}
                          placeholder="Enter designation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quality Check Authority */}
                  <div className="col-span-2">
                    <h4 className="font-medium mb-2">Quality Check Authority</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={auth.quality_check_authority_name ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'quality_check_authority_name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Staff ID</Label>
                        <Input
                          value={auth.quality_check_authority_staffid ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'quality_check_authority_staffid', e.target.value)}
                          placeholder="Enter staff ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={auth.quality_check_authority_designation ?? ''}
                          onChange={(e) => handleAuthorityChange(auth.id, 'quality_check_authority_designation', e.target.value)}
                          placeholder="Enter designation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading || !permissions?.includes('can_edit_request_authority_details')}
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