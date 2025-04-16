// components/Topbar.tsx
'use client'

import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOutIcon, SettingsIcon } from 'lucide-react';

const Topbar = () => {
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);

  const initials = user?.username
    ?.split(' ')
    .map((n) => n[0].toUpperCase())
    .join('') ?? 'U';

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white shadow px-4 flex justify-between items-center z-20">
      <div className="text-xl font-semibold">Welcome, {user?.username ?? 'User'} 👋</div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar>
            <AvatarImage src={user?.imageUrl ?? ''} alt={user?.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-4 mt-2 w-40">
          <DropdownMenuItem className="gap-2">
            <SettingsIcon size={16} /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout} className="gap-2 text-red-500">
            <LogOutIcon size={16} /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Topbar;