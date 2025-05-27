import { LucideIcon, Users } from 'lucide-react';

export type IconName = 'home' | 'search' | 'request' | 'log-in' | 'log-out' | 'file-text' | 'printer' | 'receipt' | 'calendar' | 'print' | 'users';

interface SubmenuItem {
  label: string;
  href: string;
  permission?: string;
  icon?: IconName;
}

interface SidebarLink {
  label: string;
  href: string;
  icon: IconName;
  permission?: string;
  submenu?: SubmenuItem[];
}

export const sidebarLinks: SidebarLink[] = [
  { 
    label: "Dashboard", 
    href: "/dashboard", 
    icon: 'home',
    permission: 'can_view_dashboard'
  },
  { 
    label: "Search", 
    href: "/search", 
    icon: 'search',
    permission: 'can_search_items'
  },
  { 
    label: "Request", 
    href: "/request", 
    icon: 'request',
    permission: 'can_request_items'
  },
  { 
    label: "Receive", 
    href: "/receive", 
    icon: 'log-in',
    permission: 'can_receive_items'
  },
  { 
    label: "Issue", 
    href: "/issue", 
    icon: 'log-out',
    permission: 'can_issue_items'
  },
  {
    label: "RRP",
    href: "/rrp",
    icon: 'receipt',
    permission: 'can_create_rrp'
  },
  {
    label: "Users",
    href: "/users",
    icon: 'users',
    permission: 'can_manage_users'
  },
  {
    label: "Reports",
    href: "#",
    icon: 'file-text',
    permission: 'can_access_report',
    submenu: [
      { 
        label: "Daily Issue Report", 
        href: "/reports/daily-issue",
        permission: 'can_generate_daily_issue_reports',
        icon: 'calendar'
      },
      { 
        label: "Daily", 
        href: "/reports/daily",
        permission: 'view_daily_reports',
        icon: 'calendar'
      },
      { 
        label: "Weekly", 
        href: "/reports/weekly",
        permission: 'view_weekly_reports',
        icon: 'calendar'
      },
      { 
        label: "Monthly", 
        href: "/reports/monthly",
        permission: 'view_monthly_reports',
        icon: 'calendar'
      },
    ],
  },
  {
    label: "Print",
    href: "#",
    icon: 'printer',
    permission: 'can_print',
    submenu: [
      {
        label: "Request",
        href: "/print/request",
        permission: 'can_print_request',
        icon: 'print'
      },
      {
        label: "Receive",
        href: "/print/receive",
        permission: 'can_print_receive',
        icon: 'print'
      },
      {
        label: "RRP",
        href: "/print/rrp",
        permission: 'can_print_rrp',
        icon: 'print'
      }
    ]
  }
]; 