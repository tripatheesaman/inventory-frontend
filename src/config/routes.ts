import { RouteConfig } from '@/types/routes';

export const routes: RouteConfig[] = [
  {
    path: '/login',
    requiresAuth: false,
    title: 'Login',
  },
  {
    path: '/dashboard',
    requiresAuth: true,
    title: 'Dashboard',
    permissions: ['can_view_dashboard'],
  },
  {
    path: '/search',
    requiresAuth: true,
    title: 'Search',
    permissions: ['can_search_items'],
  },
  {
    path: '/request',
    requiresAuth: true,
    title: 'Request Items',
    permissions: ['can_request_items'],
  },
  {
    path: '/receive',
    requiresAuth: true,
    title: 'Receive Items',
    permissions: ['can_receive_items'],
  },
  {
    path: '/issue',
    requiresAuth: true,
    title: 'Issue Items',
    permissions: ['can_issue_items'],
  },
  {
    path: '/reports/daily-issue',
    requiresAuth: true,
    title: 'Daily Issue Report',
    permissions: ['can_generate_daily_issue_reports'],
  },

  {
    path: '/reports/stock-card',
    requiresAuth: true,
    title: 'Stock Card Generation',
    permissions: ['can_generate_stock_card'],
  },
  {
    path: '/settings',
    requiresAuth: true,
    title: 'Settings',
    permissions: ['can_access_settings'],
  },
  {
    path: '/print',
    requiresAuth: true,
    title: 'Print',
    permissions: ['can_print'],
  },
  {
    path: '/print/request',
    requiresAuth: true,
    title: 'Print Request',
    permissions: ['can_print_request'],
  },
  {
    path: '/print/receive',
    requiresAuth: true,
    title: 'Print Receive',
    permissions: ['can_print_receive'],
  },
  {
    path: '/print/rrp',
    requiresAuth: true,
    title: 'Print RRP',
    permissions: ['can_print_rrp'],
  },
  {
    path: '/rrp',
    requiresAuth: true,
    title: 'RRP',
    permissions: ['can_create_rrp'],
  },
  {
    path: '/rrp/new',
    requiresAuth: true,
    title: 'New RRP',
    permissions: ['can_create_rrp'],
  },
  {
    path: '/rrp/items',
    requiresAuth: true,
    title: 'RRP Items',
    permissions: ['can_create_rrp'],
  },
  {
    path: '/rrp/preview',
    requiresAuth: true,
    title: 'RRP Preview',
    permissions: ['can_create_rrp'],
  },
  {
    path: '/users',
    requiresAuth: true,
    title: 'User Management',
    permissions: ['can_manage_users'],
  },
  {
    path: '/users/create',
    requiresAuth: true,
    title: 'Create User',
    permissions: ['can_create_users'],
  },
  {
    path: '/users/edit',
    requiresAuth: true,
    title: 'Edit User',
    permissions: ['can_edit_users'],
  },
  {
    path: '/users/permissions',
    requiresAuth: true,
    title: 'Manage User Permissions',
    permissions: ['can_manage_user_permissions'],
  },
  {
    path: '/fuels/issue',
    requiresAuth: true,
    title: 'Fuel Issue',
    permissions: ['can_issue_fuel'],
  },
  {
    path: '/fuels/issue/[type]',
    requiresAuth: true,
    title: 'Fuel Issue Form',
    permissions: ['can_issue_fuel'],
  },
  {
    path: '/fuels/receive',
    requiresAuth: true,
    title: 'Receive Petrol',
    permissions: ['can_receive_petrol'],
  },
  {
    path: '/reports/fuel',
    requiresAuth: true,
    title: 'Fuel Reports',
    permissions: ['can_access_fuel_menu'],
  },
  {
    path: '/reports/fuel/diesel/weekly',
    requiresAuth: true,
    title: 'Weekly Diesel Report',
    permissions: ['can_access_fuel_menu'],
  },
  {
    path: '/reports/fuel/petrol/weekly',
    requiresAuth: true,
    title: 'Weekly Petrol Report',
    permissions: ['can_access_fuel_menu'],
  },
  {
    path: '/reports/fuel/petrol/consumption',
    requiresAuth: true,
    title: 'Petrol Consumption Report',
    permissions: ['can_access_fuel_menu'],
  },
  {
    path: '/reports/fuel/oil/consumption',
    requiresAuth: true,
    title: 'Oil Consumption Report',
    permissions: ['can_access_fuel_menu'],
  },
];

// Helper function to get route config by path
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return routes.find(route => path.startsWith(route.path));
};

// Helper function to check if user has required permissions
export const hasRequiredPermissions = (route: RouteConfig, userPermissions: string[]): boolean => {
  if (!route.permissions) return true;
  return route.permissions.some(permission => userPermissions.includes(permission));
}; 