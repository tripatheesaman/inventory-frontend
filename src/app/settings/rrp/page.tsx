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

interface Supplier {
  id: number;
  name: string;
  type: 'foreign' | 'local';
}

export default function RRPSettingsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { permissions } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [authorityDetails, setAuthorityDetails] = useState<AuthorityDetails[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierType, setNewSupplierType] = useState<'foreign' | 'local'>('foreign');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorityResponse, suppliersResponse] = await Promise.all([
          API.get('/api/settings/rrp/authority-details'),
          API.get('/api/settings/rrp/suppliers')
        ]);

        if (authorityResponse.status === 200) {
          setAuthorityDetails(authorityResponse.data);
        }

        if (suppliersResponse.status === 200) {
          setSuppliers(suppliersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch data",
          duration: 3000,
        });
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!permissions?.includes('can_edit_rrp_authority_details')) {
      showErrorToast({
        title: "Access Denied",
        message: "You don't have permission to edit authority details",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await API.put('/api/settings/rrp/authority-details', {
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

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) {
      showErrorToast({
        title: "Error",
        message: "Supplier name cannot be empty",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await API.post('/api/settings/rrp/suppliers', {
        name: newSupplierName,
        type: newSupplierType
      });

      if (response.status === 201) {
        setSuppliers(prev => [...prev, response.data]);
        setNewSupplierName('');
        showSuccessToast({
          title: "Success",
          message: "Supplier added successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to add supplier",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    try {
      setIsLoading(true);
      const response = await API.put(`/api/settings/rrp/suppliers/${supplier.id}`, {
        name: supplier.name,
        type: supplier.type
      });

      if (response.status === 200) {
        setSuppliers(prev => prev.map(s => s.id === supplier.id ? response.data : s));
        setEditingSupplier(null);
        showSuccessToast({
          title: "Success",
          message: "Supplier updated successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update supplier",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      setIsLoading(true);
      const supplierToDelete = suppliers.find(s => s.id === id);
      if (!supplierToDelete) {
        throw new Error('Supplier not found');
      }

      const response = await API.delete(`/api/settings/rrp/suppliers/${id}`, {
        data: {
          name: supplierToDelete.name,
          type: supplierToDelete.type
        }
      });

      if (response.status === 200) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
        showSuccessToast({
          title: "Success",
          message: "Supplier deleted successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to delete supplier",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get unique suppliers by type
  const getUniqueSuppliersByType = (type: 'foreign' | 'local') => {
    const typeSuppliers = suppliers.filter(s => s.type === type);
    return typeSuppliers.reduce((acc: Supplier[], current) => {
      const existingSupplier = acc.find(s => s.name === current.name);
      if (!existingSupplier) {
        acc.push(current);
      }
      return acc;
    }, []);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RRP Authority Settings</CardTitle>
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
                disabled={isLoading || !permissions?.includes('can_edit_rrp_authority_details')}
                className="bg-[#003594] text-white hover:bg-[#002a6e]"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add New Supplier Form */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>New Supplier Name</Label>
                <Input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="w-40">
                <Label>Type</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newSupplierType}
                  onChange={(e) => setNewSupplierType(e.target.value as 'foreign' | 'local')}
                >
                  <option value="foreign">Foreign</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <Button onClick={handleAddSupplier} disabled={isLoading}>
                Add Supplier
              </Button>
            </div>

            {/* Suppliers List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foreign Suppliers</h3>
              <div className="space-y-2">
                {getUniqueSuppliersByType('foreign').map((supplier, index) => (
                  <div key={`foreign-${supplier.id}-${index}`} className="flex items-center gap-4 p-2 border rounded-md">
                    {editingSupplier?.id === supplier.id ? (
                      <>
                        <Input
                          value={editingSupplier.name}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleUpdateSupplier(editingSupplier)}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingSupplier(null)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{supplier.name}</span>
                        <Button
                          variant="outline"
                          onClick={() => setEditingSupplier(supplier)}
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold">Local Suppliers</h3>
              <div className="space-y-2">
                {getUniqueSuppliersByType('local').map((supplier, index) => (
                  <div key={`local-${supplier.id}-${index}`} className="flex items-center gap-4 p-2 border rounded-md">
                    {editingSupplier?.id === supplier.id ? (
                      <>
                        <Input
                          value={editingSupplier.name}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleUpdateSupplier(editingSupplier)}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingSupplier(null)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{supplier.name}</span>
                        <Button
                          variant="outline"
                          onClick={() => setEditingSupplier(supplier)}
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 