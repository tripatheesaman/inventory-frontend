import { useState, useCallback, useRef } from 'react';
import { API } from '@/lib/api';
import { ItemDetails } from '@/types/item';

export const useItemDetails = () => {
  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedId = useRef<number | null>(null);

  const fetchItemDetails = useCallback(async (id: number) => {
    // If we already have the item details and the modal is open, just show it
    if (selectedItem?.id === id && isModalOpen) {
      return;
    }

    // If we're already loading this item, don't fetch again
    if (lastFetchedId.current === id && isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    lastFetchedId.current = id;

    try {
      const response = await API.get(`/api/search/items/${id}`);
      setSelectedItem(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('Failed to fetch item details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedItem?.id, isModalOpen, isLoading]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
    lastFetchedId.current = null;
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