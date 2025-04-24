/*
File: src/app/Search/page.tsx
Purpose: Search Page
*/

'use client'

import { SearchControls, SearchResults, ItemDetailsModal } from '@/components/search';
import { useSearch } from '@/hooks/useSearch';
import { useItemDetails } from '@/hooks/useItemDetails';

export default function SearchPage() {
  const {
    searchParams,
    results,
    isLoading,
    error,
    handleSearch,
  } = useSearch();

  const {
    selectedItem,
    isModalOpen,
    fetchItemDetails,
    closeModal,
  } = useItemDetails();

  const handleRowDoubleClick = (item: { id: number }) => {
    fetchItemDetails(item.id);
  };

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Search Inventory</h1>
        
        <SearchControls
          onUniversalSearch={handleSearch('universal')}
          onEquipmentSearch={handleSearch('equipmentNumber')}
          onPartSearch={handleSearch('partNumber')}
        />

        <div className="mt-6">
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            onRowDoubleClick={handleRowDoubleClick}
            searchParams={searchParams}
          />
        </div>

        <ItemDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          item={selectedItem}
        />
      </div>
      </div>
    );
  }
  