'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { API } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
} from '@/components/ui/modal';
import { useCustomToast } from '@/components/ui/custom-toast';

interface PendingIssue {
  issueId: number;
  issueNumber: string;
  issueDate: string;
  issuedBy: string;
}

interface IssueItem {
  id: number;
  issueNumber: string;
  itemName: string;
  partNumber: string;
  nacCode: string;
  equipmentNumber: string;
  issuedQuantity: number;
  remarks: string;
}

export function PendingIssuesCount() {
  const { permissions, user } = useAuthContext();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingIssues, setPendingIssues] = useState<PendingIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<{
    items: IssueItem[];
    issueNumber: string;
    issueDate: string;
    remarks: string;
    issuedBy: string;
  } | null>(null);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!permissions?.includes('can_approve_issue')) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await API.get('/api/issue/pending');
        const uniqueIssues = response.data.reduce((acc: PendingIssue[], curr: PendingIssue) => {
          if (!acc.find(issue => issue.issueNumber === curr.issueNumber)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setPendingIssues(uniqueIssues);
        setPendingCount(uniqueIssues.length);
      } catch (error) {
        console.error('Error fetching pending issues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingCount();
  }, [permissions]);

  const handleViewDetails = async (issueNumber: string, issueDate: string) => {
    try {
      const response = await API.get(`/api/issue/items/${issueNumber}`);
      if (response.status === 200) {
        setSelectedIssue({
          items: response.data,
          issueNumber,
          issueDate,
          remarks: response.data[0]?.remarks || '',
          issuedBy: response.data[0]?.issuedBy || ''
        });
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
    }
  };

  const handleApproveIssue = async () => {
    if (!selectedIssue) return;

    try {
      const response = await API.put(`/api/issue/${selectedIssue.issueNumber}/approve`, {
        approvedBy: user?.UserInfo?.username
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Issue approved successfully",
          duration: 3000,
        });

        // Refresh the pending issues count
        const pendingResponse = await API.get('/api/issue/pending');
        const uniqueIssues = pendingResponse.data.reduce((acc: PendingIssue[], curr: PendingIssue) => {
          if (!acc.find(issue => issue.issueNumber === curr.issueNumber)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setPendingIssues(uniqueIssues);
        setPendingCount(uniqueIssues.length);
        setIsDetailsOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to approve issue');
      }
    } catch (error) {
      console.error('Error approving issue:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to approve issue",
        duration: 5000,
      });
    }
  };

  const handleRejectClick = () => {
    setIsRejectOpen(true);
  };

  const handleRejectIssue = async () => {
    if (!selectedIssue || !rejectionReason.trim()) {
      showErrorToast({
        title: "Error",
        message: "Please provide a reason for rejection",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await API.put(`/api/issue/${selectedIssue.issueNumber}/reject`, {
        rejectedBy: user?.UserInfo?.username,
        rejectionReason: rejectionReason.trim()
      });

      if (response.status === 200) {
        showSuccessToast({
          title: "Success",
          message: "Issue rejected successfully",
          duration: 3000,
        });

        // Refresh the pending issues count
        const pendingResponse = await API.get('/api/issue/pending');
        const uniqueIssues = pendingResponse.data.reduce((acc: PendingIssue[], curr: PendingIssue) => {
          if (!acc.find(issue => issue.issueNumber === curr.issueNumber)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setPendingIssues(uniqueIssues);
        setPendingCount(uniqueIssues.length);
        setIsDetailsOpen(false);
        setIsRejectOpen(false);
        setRejectionReason('');
      } else {
        throw new Error(response.data?.message || 'Failed to reject issue');
      }
    } catch (error) {
      console.error('Error rejecting issue:', error);
      showErrorToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to reject issue",
        duration: 5000,
      });
    }
  };

  if (!permissions?.includes('can_approve_issue')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#003594] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Card className="cursor-pointer hover:bg-[#003594]/5 transition-colors border-[#002a6e]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-[#003594]">Pending Issues</CardTitle>
              <FileText className="h-5 w-5 text-[#003594]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-3xl font-bold text-[#003594]">...</div>
              ) : (
                <div className="text-3xl font-bold text-[#003594]">{pendingCount ?? 0}</div>
              )}
              <p className="text-sm text-gray-500 mt-1">Issues awaiting approval</p>
            </CardContent>
          </Card>
        </ModalTrigger>
        <ModalContent className="max-w-4xl bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
              Pending Issues
            </ModalTitle>
            <ModalDescription className="text-gray-600 mt-2">
              You have {pendingCount ?? 0} pending issue{pendingCount !== 1 ? 's' : ''} that need your attention.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {pendingIssues.map((issue) => (
              <div
                key={issue.issueId}
                className="rounded-lg border border-[#002a6e]/10 p-6 hover:bg-[#003594]/5 transition-all duration-200 hover:shadow-md"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#003594]">Issue #</p>
                  <p className="text-lg font-semibold text-gray-900">{issue.issueNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#003594]">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(issue.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#003594]">Issued By</p>
                  <p className="text-lg font-semibold text-gray-900">{issue.issuedBy}</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleViewDetails(issue.issueNumber, issue.issueDate)}
                    className="flex items-center gap-2 bg-[#003594] hover:bg-[#003594]/90 text-white transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="max-w-5xl bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <ModalTitle className="text-2xl font-bold bg-gradient-to-r from-[#003594] to-[#d2293b] bg-clip-text text-transparent">
                  Issue Details #{selectedIssue?.issueNumber}
                </ModalTitle>
                <div className="mt-2 text-gray-600 space-y-2">
                  <div className="flex items-center gap-4">
                    <span>Issue Date: {selectedIssue?.issueDate && new Date(selectedIssue.issueDate).toLocaleDateString()}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                    <span>Issued By: {selectedIssue?.issuedBy}</span>
                  </div>
                  {selectedIssue?.remarks && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-[#002a6e]/10">
                      <span className="font-medium text-[#003594]">Remarks: </span>
                      {selectedIssue.remarks}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
                  onClick={handleApproveIssue}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2 bg-[#d2293b] hover:bg-[#d2293b]/90 transition-colors"
                  onClick={handleRejectClick}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </ModalHeader>
          <div className="mt-6">
            <div className="overflow-x-auto rounded-lg border border-[#002a6e]/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#003594]/5">
                    <th className="text-left p-4 font-semibold text-[#003594]">Item Name</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Part Number</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Equipment Number</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Quantity</th>
                    <th className="text-left p-4 font-semibold text-[#003594]">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedIssue?.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#002a6e]/10 hover:bg-[#003594]/5 transition-colors">
                      <td className="p-4 text-gray-900">{item.itemName}</td>
                      <td className="p-4 text-gray-900">{item.partNumber}</td>
                      <td className="p-4 text-gray-900">{item.equipmentNumber}</td>
                      <td className="p-4 text-gray-900">{item.issuedQuantity}</td>
                      <td className="p-4 text-gray-900">{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <ModalContent className="max-w-md bg-white rounded-xl shadow-xl border-[#002a6e]/10">
          <ModalHeader className="border-b border-[#002a6e]/10 pb-4">
            <ModalTitle className="text-xl font-bold text-[#003594]">Reject Issue</ModalTitle>
            <ModalDescription className="text-gray-600 mt-2">
              Please provide a reason for rejecting this issue.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#003594]">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full min-h-[100px] p-3 rounded-lg border border-[#002a6e]/10 focus:border-[#003594] focus:ring-[#003594]/20 transition-colors"
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              className="border-[#002a6e]/10 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectIssue}
              className="bg-[#d2293b] hover:bg-[#d2293b]/90 text-white transition-colors"
            >
              Reject Issue
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
} 