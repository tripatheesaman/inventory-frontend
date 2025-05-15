'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { API } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
} from '@/components/ui/modal';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/components/ui/custom-toast';
import { RRPDetailsModal } from '@/components/rrp/RRPDetailsModal';

interface PendingRRP {
  id: number;
  rrp_number: string;
  supplier_name: string;
  date: string;
  currency: string;
  forex_rate: string;
  item_price: string;
  customs_charge: string;
  customs_service_charge: string;
  vat_percentage: string;
  invoice_number: string;
  invoice_date: string;
  po_number: string | null;
  airway_bill_number: string | null;
  inspection_details: {
    inspection_user: string;
    inspection_details: Record<string, any>;
  };
  approval_status: string;
  created_by: string;
  total_amount: string;
  receive_fk: number;
  item_name: string;
  nac_code: string;
  part_number: string;
  received_quantity: string;
  unit: string;
  received_by: string | null;
  receive_date: string;
  request_number: string;
  request_date: string;
  requested_by: string;
  equipment_number: string;
  freight_charge: string;
  customs_date: string;
}

interface Config {
  supplier_list_local: string;
  currency_list: string;
  supplier_list_foreign: string;
  inspection_user_details: Array<{
    name: string;
    designation: string;
  }>;
  vat_rate: number;
}

interface PendingRRPResponse {
  config: Config;
  pendingRRPs: PendingRRP[];
}

export function PendingRRPCount() {
  const { permissions, user } = useAuthContext();
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pendingRRPs, setPendingRRPs] = useState<PendingRRP[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedRRP, setSelectedRRP] = useState<{
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
  } | null>(null);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      setIsLoading(true);
      if (!permissions?.includes('can_approve_rrp')) {
        setIsLoading(false);
        return;
      }

      const response = await API.get('/api/rrp/pending');
      const data = response.data as PendingRRPResponse;
      console.log(data);
      // Store config
      setConfig(data.config);
      
      // Group items by RRP number
      const rrpGroups = data.pendingRRPs.reduce((acc: { [key: string]: PendingRRP[] }, item: PendingRRP) => {
        if (!acc[item.rrp_number]) {
          acc[item.rrp_number] = [];
        }
        acc[item.rrp_number].push(item);
        return acc;
      }, {});

      setPendingRRPs(data.pendingRRPs);
      setPendingCount(Object.keys(rrpGroups).length);
    } catch (error) {
      console.error('Error fetching pending RRPs:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to fetch pending RRPs",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (rrpNumber: string, rrpDate: string) => {
    const rrpItems = pendingRRPs.filter(rrp => rrp.rrp_number === rrpNumber);
    if (rrpItems.length === 0) return;

    const firstItem = rrpItems[0];
    const isForeign = firstItem.currency !== 'NPR';

    setSelectedRRP({
      items: rrpItems.map(item => ({
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
    });
    setIsDetailsOpen(true);
  };

  const handleApproveRRP = async () => {
    if (!selectedRRP) return;

    try {
      await API.post(`/api/rrp/approve/${selectedRRP.rrpNumber}`);
      showSuccessToast({
        title: "Success",
        message: "RRP approved successfully",
        duration: 3000,
      });
      setIsDetailsOpen(false);
      fetchPendingCount();
    } catch (error) {
      console.error('Error approving RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to approve RRP",
        duration: 3000,
      });
    }
  };

  const handleRejectRRP = async (reason: string) => {
    if (!selectedRRP) return;

    try {
      await API.post(`/api/rrp/reject/${selectedRRP.rrpNumber}`, { reason });
      showSuccessToast({
        title: "Success",
        message: "RRP rejected successfully",
        duration: 3000,
      });
      setIsDetailsOpen(false);
      fetchPendingCount();
    } catch (error) {
      console.error('Error rejecting RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to reject RRP",
        duration: 3000,
      });
    }
  };

  const handleEditRRP = async (data: any) => {
    if (!selectedRRP) return;

    try {
        console.log(data);
      await API.put(`/api/rrp/update/${selectedRRP.rrpNumber}`, data);
      showSuccessToast({
        title: "Success",
        message: "RRP updated successfully",
        duration: 3000,
      });
      setIsDetailsOpen(false);
      fetchPendingCount();
    } catch (error) {
      console.error('Error updating RRP:', error);
      showErrorToast({
        title: "Error",
        message: "Failed to update RRP",
        duration: 3000,
      });
    }
  };

  if (!permissions?.includes('can_approve_rrp')) {
    return null;
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending RRPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{pendingCount}</div>
              )}
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle>Pending RRPs</ModalTitle>
            <ModalDescription>
              You have {pendingCount} pending RRP{pendingCount !== 1 ? 's' : ''} that need your attention.
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            {pendingRRPs.map((rrp) => (
              <div
                key={rrp.id}
                className="rounded-lg border p-4 hover:bg-accent/50"
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium">RRP #</p>
                    <p className="text-lg">{rrp.rrp_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-lg">{new Date(rrp.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-lg">{rrp.created_by}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleViewDetails(rrp.rrp_number, rrp.date)}
                      className="flex items-center gap-2"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      {selectedRRP && (
        <RRPDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          rrpData={selectedRRP}
          onApprove={handleApproveRRP}
          onReject={handleRejectRRP}
          onEdit={handleEditRRP}
          config={config!}
        />
      )}
    </>
  );
} 