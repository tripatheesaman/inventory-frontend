/*
File: src/app/components/Sidebar.tsx
*/
'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Dispatch, SetStateAction } from "react";
import { useAuthContext } from "@/context/AuthContext/AuthContext";
import { cn } from "@/lib/utils";
import { Home, LogIn, LogOut, FileText, ChevronDown, Search } from "lucide-react";
import { sidebarLinks } from "./sidebarConfig";
import { SidebarIcon } from "./SidebarIcon";

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
        <h2 className="text-xl font-bold">I</h2>
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
                <SidebarIcon name={icon} />
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
