import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '@/lib/api';

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
  const [config, setConfig] = useState<RRPConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configLoadedRef = useRef(false);

  const fetchConfig = useCallback(async () => {
    if (!configLoadedRef.current) {
      try {
        const response = await API.get('/api/rrp/config');
        setConfig(response.data);
        configLoadedRef.current = true;
      } catch (error) {
        console.error('Error fetching RRP config:', error);
        // Don't show toast here to avoid dependency issues
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshConfig = async () => {
    configLoadedRef.current = false;
    setIsLoading(true);
    await fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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