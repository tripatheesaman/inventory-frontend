'use client'

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/utils';

interface SearchBarProps {
  placeholder: string;
  onSearch: (value: string) => void;
  className?: string;
  debounceTime?: number;
}

export const SearchBar = ({ 
  placeholder, 
  onSearch, 
  className,
  debounceTime = 300 
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        onSearch(value);
      }, debounceTime);
      return () => clearTimeout(timer);
    },
    [onSearch, debounceTime]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[#003594] group-hover:text-[#d2293b] transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2.5 border border-[#002a6e]/10 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#003594] focus:border-[#003594] hover:border-[#d2293b]/20 sm:text-sm transition-colors group"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}; 