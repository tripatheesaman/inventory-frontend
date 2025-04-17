// Sidebar.tsx
'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Home', href: '/dashboard', permission: 'can_view_home' },
  { name: 'Search', href: '/dashboard/search', permission: 'can_search' },
  { name: 'Issue', href: '/dashboard/issue', permission: 'can_issue' },
  { name: 'Receive', href: '/dashboard/receive', permission: 'can_receive' },
  { name: 'Reports', href: '/dashboard/reports', permission: 'can_view_reports' },
];

const Sidebar = ({ isOpen, toggleSidebar, permissions }: { isOpen: boolean; toggleSidebar: () => void; permissions: string[] }) => {
  const [windowWidth, setWindowWidth] = useState(1024);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const autoCollapsed = windowWidth < 768;
  const collapsed = autoCollapsed || !isOpen;

  return (
    <div
      className={`transition-all duration-300 bg-white shadow h-full fixed top-0 left-0 z-30 ${collapsed ? 'w-16' : 'w-64'}`}
      onMouseEnter={() => autoCollapsed && toggleSidebar()}
      onMouseLeave={() => autoCollapsed && toggleSidebar()}
    >
      <div className="p-4 font-bold text-lg">Menu</div>
      <ul>
        {menuItems.map(
          (item) =>
            permissions.includes(item.permission) && (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`block p-4 hover:bg-gray-100 ${pathname === item.href ? 'bg-gray-200 font-semibold' : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            )
        )}
      </ul>
    </div>
  );
};

export default Sidebar;