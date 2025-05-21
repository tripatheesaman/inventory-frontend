/*
File: src/components/layout/TopBar.tsx
Purpose: Top navigation bar with user profile, logout, and fallback avatar
*/

'use client';

import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuthContext();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="h-16 border-b border-[#002a6e]/20 bg-white shadow-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
          className="cursor-pointer hover:bg-[#003594]/10 rounded-full transition-colors"
      >
          <Menu className="h-5 w-5 text-[#003594]" />
      </Button>
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-[#003594]">Inventory Management System</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:block text-right">
          <p className="text-sm text-gray-600">Welcome,</p>
          <p className="font-medium text-[#003594]">{user?.UserInfo.name || 'User'}</p>
        </div>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="border-2 border-[#003594]/20 hover:border-[#003594] transition-colors cursor-pointer">
              <AvatarImage src="" alt={user?.UserInfo.name} />
              <AvatarFallback className="bg-[#003594] text-white font-medium">
                {getInitials(user?.UserInfo.name || 'U')}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-2 bg-white border border-[#002a6e]/20 shadow-lg">
            <DropdownMenuLabel className="text-[#003594] font-medium">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#002a6e]/20" />
            <DropdownMenuItem 
              onClick={logout}
              className="text-gray-700 hover:bg-[#003594]/10 hover:text-[#003594] cursor-pointer focus:bg-[#003594]/10 focus:text-[#003594]"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
