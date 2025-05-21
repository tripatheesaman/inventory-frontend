export type IconName = 'home' | 'log-in' | 'log-out' | 'file-text' | 'search' | 'request' | 'printer' | 'receipt' | 'calendar' | 'print';

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
    permission: 'view_dashboard'
  },
  { 
    label: "Search", 
    href: "/search", 
    icon: 'search',
    permission: 'search_items'
  },
  { 
    label: "Request", 
    href: "/request", 
    icon: 'request',
    permission: 'request_items'
  },
  { 
    label: "Receive", 
    href: "/receive", 
    icon: 'log-in',
    permission: 'receive_items'
  },
  { 
    label: "Issue", 
    href: "/issue", 
    icon: 'log-out',
    permission: 'issue_items'
  },
  {
    label: "RRP",
    href: "/rrp",
    icon: 'receipt',
    permission: 'can_create_rrp'
  },
  {
    label: "Reports",
    href: "/reports",
    icon: 'file-text',
    permission: 'view_reports',
    submenu: [
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