import { useState, useCallback } from 'react';
import { API } from '@/lib/api';

interface ItemDetails {
  id: number;
  name: string;
  equipmentNumber: string;
  partNumber: string;
  description?: string;
  location?: string;
  quantity?: number;
}

export const useItemDetails = () => {
  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItemDetails = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(`/api/items/${id}`);
      setSelectedItem(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('Failed to fetch item details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  return {
    selectedItem,
    isModalOpen,
    isLoading,
    error,
    fetchItemDetails,
    closeModal,
  };
}; 