export type IconName = 'home' | 'log-in' | 'log-out' | 'file-text' | 'search' | 'request' | 'printer' | 'receipt';

interface SubmenuItem {
  label: string;
  href: string;
  permission?: string;
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
  {
    label: "Print",
    href: "#",
    icon: 'printer',
    permission: 'can_print',
    submenu: [
      {
        label: "Request",
        href: "/print/request",
        permission: 'can_print_request'
      },
      {
        label: "Receive",
        href: "/print/receive",
        permission: 'can_print_receive'
      }
    ]
  }
]; 