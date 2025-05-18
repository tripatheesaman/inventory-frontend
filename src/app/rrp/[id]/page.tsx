'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';
import { RRPDetailsModal } from '@/components/rrp/RRPDetailsModal';
import { useNotification } from '@/context/NotificationContext';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { use } from 'react';

interface RRPDetails {
  items: any[];
  rrpNumber: string;
  rrpDate: string;
  type: 'local' | 'foreign';
  supplier: string;
  inspectionUser: string;
  invoiceNumber: string;
  invoiceDate: string;
  freightCharge: number;
  customsDate?: string;
  poNumber?: string;
  airwayBillNumber?: string;
  currency?: string;
  forexRate?: number;
}

interface Config {
  supplier_list_local: string;
  supplier_list_foreign: string;
  inspection_user_details: Array<{
    name: string;
    designation: string;
  }>;
  vat_rate: number;
  customServiceCharge?: number;
}

export default function RRPDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const notificationId = searchParams.get('notificationId');
  const router = useRouter();
  const { showErrorToast, showSuccessToast } = useCustomToast();
  const { markAsRead } = useNotification();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [rrpDetails, setRRPDetails] = useState<RRPDetails | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const fetchRRPDetails = async () => {
      try {
        const response = await API.get(`/api/rrp/items/${resolvedParams.id}`);
        const data = response.data;

        // Transform the data to match our interface
        const firstItem = data.rrpDetails[0];
        const isForeign = firstItem.currency !== 'NPR';

        const transformedData: RRPDetails = {
          items: data.rrpDetails.map((item: any) => ({
            id: item.id,
            item_name: item.item_name,
            part_number: item.part_number,
            nac_code: item.nac_code,
            equipment_number: item.equipment_number,
            received_quantity: item.received_quantity,
            unit: item.unit,
            item_price: item.item_price,
            vat_percentage: item.vat_percentage,
            customs_charge: item.customs_charge,
            currency: item.currency,
            forex_rate: item.forex_rate,
            freight_charge: parseFloat(item.freight_charge) || 0,
            customs_service_charge: parseFloat(item.customs_service_charge) || 0,
            total_amount: parseFloat(item.total_amount) || 0
          })),
          rrpNumber: firstItem.rrp_number,
          rrpDate: firstItem.date,
          type: isForeign ? 'foreign' : 'local',
          supplier: firstItem.supplier_name,
          inspectionUser: firstItem.inspection_details.inspection_user,
          invoiceNumber: firstItem.invoice_number,
          invoiceDate: firstItem.invoice_date,
          freightCharge: parseFloat(firstItem.freight_charge) || 0,
          customsDate: isForeign ? firstItem.customs_date : undefined,
          poNumber: isForeign ? (firstItem.po_number || undefined) : undefined,
          airwayBillNumber: isForeign ? (firstItem.airway_bill_number || undefined) : undefined,
          currency: isForeign ? firstItem.currency : undefined,
          forexRate: isForeign ? parseFloat(firstItem.forex_rate) : undefined
        };

        setRRPDetails(transformedData);
        setConfig(data.config);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching RRP details:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to fetch RRP details",
          duration: 3000,
        });
        setIsLoading(false);
      }
    };

    fetchRRPDetails();
  }, [resolvedParams.id]);

  const handleDeleteItem = async (itemId: number) => {
    if (!rrpDetails) return;

    // Remove the item from the local state
    const updatedItems = rrpDetails.items.filter(item => item.id !== itemId);
    setRRPDetails({
      ...rrpDetails,
      items: updatedItems
    });
  };

  const handleEdit = async (data: any) => {
    try {
      // Transform the data to match the backend's expected format
      const transformedData = {
        // Main RRP details
        rrp_number: data.rrpNumber,
        supplier_name: data.supplier,
        date: data.rrpDate,
        currency: data.currency || 'NPR',
        forex_rate: data.forexRate || 1.0,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        customs_date: data.customsDate,
        po_number: data.poNumber,
        airway_bill_number: data.airwayBillNumber,
        inspection_user: data.inspectionUser,
        created_by: user?.UserInfo?.username || '',
        approval_status: 'PENDING',

        // Array of items to update
        items: data.items.map((item: any) => ({
          id: item.id,
          item_price: parseFloat(item.item_price?.toString() || '0'),
          customs_charge: parseFloat(item.customs_charge?.toString() || '0'),
          customs_service_charge: parseFloat(item.customs_service_charge?.toString() || '0'),
          vat_percentage: parseFloat(item.vat_percentage?.toString() || '0'),
          freight_charge: parseFloat(item.freight_charge?.toString() || '0'),
          total_amount: parseFloat(item.total_amount?.toString() || '0'),
          approval_status: 'PENDING'
        }))
      };

      const response = await API.put(`/api/rrp/update/${data.rrpNumber}`, transformedData);
      console.log(data.rrpNumber);
      // Check if the update was successful
      if (response.status === 200 && response.data) {
        if (notificationId) {
          // Mark as read
          await markAsRead(Number(notificationId));
          // Delete the notification
          await API.delete(`/api/notifications/${notificationId}`);
          // Remove the notification from the URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }

        showSuccessToast({
          title: "Success",
          message: "RRP updated successfully",
          duration: 3000,
        });

        router.push('/dashboard');
      } else {
        throw new Error('Failed to update RRP');
      }
    } catch (error) {
      console.error('Error updating RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update RRP",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!rrpDetails || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">RRP not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <RRPDetailsModal
        isOpen={true}
        onClose={() => router.push('/dashboard')}
        rrpData={rrpDetails}
        onEdit={handleEdit}
        onDeleteItem={handleDeleteItem}
        config={config}
        isEditOnly={true}
      />
    </div>
  );
} 