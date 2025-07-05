/*
File: src/app/components/Sidebar.tsx
*/
'use client'

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/utils";
import { ChevronDown } from "lucide-react";
import { sidebarLinks } from "./sidebarConfig";
import { SidebarIcon } from "./SidebarIcon";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
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
    <aside className={cn(
      "h-full border-r transition-all duration-300 overflow-y-auto",
      "bg-gradient-to-b from-[#003594] to-[#002a6e]",
      collapsed ? "w-16" : "w-64"
    )}> 
      <div className="p-4 bg-[#003594] border-b border-[#002a6e]">
        <Image
          src="/images/nepal_airlines_logo.jpeg"
          alt="Nepal Airlines Logo"
          width={collapsed ? 40 : 120}
          height={collapsed ? 40 : 120}
          className="h-auto w-auto transition-all duration-300"
        />
      </div>
      <nav className="px-2 py-4">
        {sidebarLinks.map(({ label, href, icon, submenu, permission }) => 
          hasPermission(permission) && (
            <div key={label}>
              <Link
                href={href}
                className={cn(
                  "flex items-center px-4 py-2.5 text-gray-100 hover:bg-white/10 rounded-md transition-colors",
                  "hover:text-white",
                  pathname === href && "bg-white/20 text-white font-medium",
                  "group"
                )}
                onClick={() => toggleSubmenu(label)}
              >
                <SidebarIcon name={icon} className="text-gray-300 group-hover:text-white transition-colors" />
                {!collapsed && <span className="ml-3">{label}</span>}
                {submenu && !collapsed && (
                  <ChevronDown
                    className={cn(
                      "ml-auto transition-transform text-gray-300 group-hover:text-white",
                      activeMenu === label && "rotate-180"
                    )}
                    size={16}
                  />
                )}
              </Link>
              {submenu && activeMenu === label && !collapsed && (
                <div className="ml-4 mt-1 space-y-1">
                  {submenu.map(({ label: subLabel, href: subHref, permission: subPermission, icon: subIcon }) => 
                    hasPermission(subPermission) && (
                      <Link
                        key={subHref}
                        href={subHref}
                        className={cn(
                          "flex items-center px-4 py-2 text-gray-200 hover:bg-white/10 rounded-md transition-colors",
                          "hover:text-white group",
                          pathname === subHref && "bg-white/20 text-white font-medium"
                        )}
                      >
                        {subIcon && (
                          <SidebarIcon 
                            name={subIcon} 
                            className="text-gray-300 group-hover:text-white transition-colors" 
                          />
                        )}
                        <span className={cn("ml-3", !subIcon && "ml-8")}>{subLabel}</span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          )
        )}
      </nav>
    </aside>
  );
}
