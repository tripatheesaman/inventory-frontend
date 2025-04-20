// components/ProtectedRoute.tsx
'use client'

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext/AuthContext";
import { getRouteConfig, hasRequiredPermissions } from "@/config/routes";
import Unauthorized from "@/app/(fallback)/unauthorized/page";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, permissions } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const routeConfig = getRouteConfig(pathname);

    if (!routeConfig) {
      // Route not found in configuration
      router.push('/dashboard');
      return;
    }

    if (routeConfig.requiresAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !hasRequiredPermissions(routeConfig, permissions)) {
      // User doesn't have required permissions
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, pathname, router, permissions]);

  const routeConfig = getRouteConfig(pathname);

  if (!routeConfig) {
    return null;
  }

  if (routeConfig.requiresAuth && !isAuthenticated) {
    return null;
  }

  if (isAuthenticated && !hasRequiredPermissions(routeConfig, permissions)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
