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
    permissions: ['view_dashboard'],
  },
  {
    path: '/search',
    requiresAuth: true,
    title: 'Search',
    permissions: ['search_items'],
  },
  {
    path: '/request',
    requiresAuth: true,
    title: 'Request Items',
    permissions: ['request_items'],
  },
  {
    path: '/receive',
    requiresAuth: true,
    title: 'Receive Items',
    permissions: ['receive_item'],
  },
  {
    path: '/issue',
    requiresAuth: true,
    title: 'Issue Items',
    permissions: ['issue_items'],
  },
  {
    path: '/reports',
    requiresAuth: true,
    title: 'Reports',
    permissions: ['view_reports'],
  },
  {
    path: '/settings',
    requiresAuth: true,
    title: 'Settings',
    permissions: ['manage_settings'],
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