/*
File: src/app/components/Sidebar.tsx
*/
'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Dispatch, SetStateAction } from "react";
import { useAuthContext } from "@/context/AuthContext/AuthContext";
import { cn } from "@/lib/utils";
import { Home, LogIn, LogOut, FileText, ChevronDown } from "lucide-react";

const sidebarLinks = [
  { 
    label: "Dashboard", 
    href: "/dashboard", 
    icon: <Home size={20} />,
    permission: 'view_dashboard'
  },
  { 
    label: "Issue", 
    href: "/issue", 
    icon: <LogOut size={20} />,
    permission: 'issue_items'
  },
  { 
    label: "Receive", 
    href: "/receive", 
    icon: <LogIn size={20} />,
    permission: 'receive_items'
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <FileText size={20} />,
    permission: 'view_reports',
    submenu: [
      { 
        label: "Daily", 
        href: "/reports/daily",
        permission: 'view_daily_reports'
      },
      { 
        label: "Weekly", 
        href: "/reports/weekly",
        permission: 'view_weekly_reports'
      },
      { 
        label: "Monthly", 
        href: "/reports/monthly",
        permission: 'view_monthly_reports'
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { permissions } = useAuthContext();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return permissions?.includes(permission);
  };

  const toggleSubmenu = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  return (
    <aside className={cn("h-full bg-white border-r w-64 transition-all duration-300 overflow-y-auto", collapsed ? "w-16" : "w-64")}> 
      <div className="p-4">
        <h2 className="text-xl font-bold">Inventory</h2>
      </div>
      <nav className="px-2">
        {sidebarLinks.map(({ label, href, icon, submenu, permission }) => (
          hasPermission(permission) && (
            <div key={label}>
              <Link
                href={href}
                className={cn(
                  "flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md",
                  pathname === href && "bg-gray-100"
                )}
                onClick={() => toggleSubmenu(label)}
              >
                {icon}
                {!collapsed && <span className="ml-3">{label}</span>}
                {submenu && !collapsed && (
                  <ChevronDown
                    className={cn(
                      "ml-auto transition-transform",
                      activeMenu === label && "rotate-180"
                    )}
                    size={16}
                  />
                )}
              </Link>
              {submenu && activeMenu === label && !collapsed && (
                <div className="ml-4">
                  {submenu.map(({ label: subLabel, href: subHref, permission: subPermission }) => (
                    hasPermission(subPermission) && (
                      <Link
                        key={subHref}
                        href={subHref}
                        className={cn(
                          "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md",
                          pathname === subHref && "bg-gray-100"
                        )}
                      >
                        {subLabel}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </nav>
    </aside>
  );
}
