import { useState, useEffect, useRef } from 'react';
import { API } from '@/lib/api';
import { useCustomToast } from '@/components/ui/custom-toast';

interface InspectionUser {
  name: string;
  designation: string;
}

interface RRPConfig {
  supplier_list_local: string;
  supplier_list_foreign: string;
  currency_list: string;
  inspection_user_details: InspectionUser[];
  vat_rate: number;
  customServiceCharge: number;
}

export function useRRP() {
  const { showErrorToast } = useCustomToast();
  const [config, setConfig] = useState<RRPConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configLoadedRef = useRef(false);

  const fetchConfig = async () => {
    if (!configLoadedRef.current) {
      try {
        const response = await API.get('/api/rrp/config');
        console.log('RRP Config:', response.data);
        setConfig(response.data);
        configLoadedRef.current = true;
      } catch (error) {
        console.error('Error fetching RRP config:', error);
        showErrorToast({
          title: "Error",
          message: "Failed to load RRP configuration",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const refreshConfig = async () => {
    configLoadedRef.current = false;
    setIsLoading(true);
    await fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Helper functions to get formatted data
  const getLocalSuppliers = () => config?.supplier_list_local.split(',').map(s => s.trim()) || [];
  const getForeignSuppliers = () => config?.supplier_list_foreign.split(',').map(s => s.trim()) || [];
  const getCurrencies = () => config?.currency_list.split(',').map(c => c.trim()) || [];
  const getInspectionUsers = () => config?.inspection_user_details || [];

  return {
    config,
    isLoading,
    refreshConfig,
    getLocalSuppliers,
    getForeignSuppliers,
    getCurrencies,
    getInspectionUsers,
  };
} 