'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useCustomToast } from '@/components/ui/custom-toast';
import { API } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  staffId: string;
  role: string;
  designation: string;
  status: number;
  permissions: string[];
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { permissions } = useAuthContext();
  const { showErrorToast } = useCustomToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    staffId: '',
    role: '',
    designation: '',
    status: 1,
  });

  useEffect(() => {
    Promise.all([
      fetchUserData(),
      fetchPermissionsAndRoles(),
    ]);
  }, [params.id]);

  const fetchUserData = async () => {
    try {
      const response = await API.get(`/api/users/${params.id}`);
      if (response.status === 200) {
        const userData: User = response.data;
        setFormData({
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          staffId: userData.staffId,
          role: userData.role,
          designation: userData.designation,
          status: userData.status,
        });
        setSelectedPermissions(userData.permissions);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to fetch user data",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissionsAndRoles = async () => {
    try {
      const [permissionsResponse, rolesResponse] = await Promise.all([
        API.get('/api/permissions'),
        API.get('/api/roles'),
      ]);

      if (permissionsResponse.status === 200) {
        setAvailablePermissions(permissionsResponse.data);
      }
      if (rolesResponse.status === 200) {
        setAvailableRoles(rolesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to fetch permissions and roles",
        duration: 3000,
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await API.put(`/api/users/${params.id}`, {
        ...formData,
        permissions: selectedPermissions,
      });

      if (response.status === 200) {
        showErrorToast({
          title: "Success",
          message: "User updated successfully",
          duration: 3000,
        });
        router.push('/users');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update user",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#003594]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 text-[#003594] hover:bg-[#003594]/10"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      <Card className="border-[#002a6e]/10 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-[#002a6e]/10">
          <CardTitle className="text-xl font-semibold text-[#002a6e]">Edit User</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffId" className="text-sm font-medium text-gray-700">Staff ID</Label>
                <Input
                  id="staffId"
                  value={formData.staffId}
                  onChange={(e) => handleInputChange('staffId', e.target.value)}
                  required
                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-medium text-gray-700">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  required
                  className="h-10 bg-white border-[#002a6e]/10 focus:border-[#002a6e] focus:ring-1 focus:ring-[#002a6e]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.status === 1}
                    onCheckedChange={(checked) => handleInputChange('status', checked ? 1 : 0)}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        {permission.name}
                      </Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-[#002a6e]/20 text-[#002a6e] hover:bg-[#002a6e]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#003594] text-white hover:bg-[#002a6e]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 