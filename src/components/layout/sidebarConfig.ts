export type IconName = 'home' | 'search' | 'request' | 'log-in' | 'log-out' | 'file-text' | 'printer' | 'receipt' | 'calendar' | 'print' | 'users' | 'settings' | 'fuel' | 'droplet' | 'package';

interface SubmenuItem {
  label: string;
  href: string;
  permission?: string;
  icon?: IconName;
  submenu?: SubmenuItem[];
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
        label: "Stock Card", 
        href: "/reports/stock-card",
        permission: 'can_generate_stock_card',
        icon: 'file-text'
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
      { 
        label: "Fuel Reports", 
        href: "/reports/fuel",
        permission: 'can_access_fuel_menu',
        icon: 'fuel',
        submenu: [
          {
            label: "Weekly Diesel",
            href: "/reports/fuel/diesel/weekly",
            permission: 'can_access_fuel_menu',
            icon: 'droplet'
          },
          {
            label: "Weekly Petrol",
            href: "/reports/fuel/petrol/weekly",
            permission: 'can_access_fuel_menu',
            icon: 'droplet'
          },
          {
            label: "Petrol Consumption",
            href: "/reports/fuel/petrol/consumption",
            permission: 'can_access_fuel_menu',
            icon: 'droplet'
          },
          {
            label: "Oil Consumption",
            href: "/reports/fuel/oil/consumption",
            permission: 'can_access_fuel_menu',
            icon: 'droplet'
          }
        ]
      }
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
  },
  {
    label: "Fuels & Lubes", 
    href: "#", 
    icon: 'fuel',
    permission: 'can_access_fuel_menu',
    submenu: [
      {
        label: "Fuel Issue",
        href: "/fuels/issue",
        permission: 'can_issue_fuel',
        icon: 'droplet'
      },
      {
        label: "Receive Petrol",
        href: "/fuels/receive",
        permission: 'can_receive_petrol',
        icon: 'package'
      }
    ]
  },
  {
    label: "Settings",
    href: "#",
    icon: 'settings',
    permission: 'can_access_settings',
    submenu: [
      {
        label: "App Settings",
        href: "/settings/app",
        permission: 'can_access_settings',
        icon: 'settings'
      },
      {
        label: "Request Settings",
        href: "/settings/request",
        permission: 'can_access_request_settings',
        icon: 'settings'
      },
      {
        label: "Receive Settings",
        href: "/settings/receive",
        permission: 'can_access_receive_settings',
        icon: 'settings'
      },
      {
        label: "Issue Settings",
        href: "/settings/issue",
        permission: 'can_access_issue_settings',
        icon: 'settings'
      },
      {
        label: "RRP Settings",
        href: "/settings/rrp",
        permission: 'can_access_rrp_settings',
        icon: 'settings'
      },
      {
        label: "Fuel Settings",
        href: "/settings/fuel",
        permission: 'can_access_settings',
        icon: 'settings'
      }
    ]
  }
]; 