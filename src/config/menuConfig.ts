/*
File: src/config/menuConfig.ts
Purpose: Sidebar menu structure with permissions
*/

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

const menuConfig: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'home',
      permission: 'view_dashboard',
    },
    {
      label: 'Search',
      href: '/search',
      icon: 'search',
      permission: 'search_items',
    },
    {
      label: 'Issue Items',
      href: '/issue',
      icon: 'upload',
      permission: 'issue_items',
    },
    {
      label: 'Receive Items',
      href: '/receive',
      icon: 'download',
      permission: 'receive_items',
    },
    {
      label: 'Reports',
      icon: 'bar-chart-2',
      permission: 'view_reports',
      children: [
        {
          label: 'Daily Report',
          href: '/reports/daily',
          permission: 'view_reports',
        },
        {
          label: 'Monthly Report',
          href: '/reports/monthly',
          permission: 'view_reports',
        },
      ],
    },
  ];
  
  export default menuConfig;
  