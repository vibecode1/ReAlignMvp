import { useAuth } from "@/context/AuthContext";

type Role = 'negotiator' | 'seller' | 'buyer' | 'listing_agent' | 'buyers_agent' | 'escrow';

/**
 * Hook to check if the current user has access based on their role
 * @param allowedRoles Array of roles that are allowed to access
 * @returns Object with hasAccess boolean and loading state
 */
export function useRoleAccess(allowedRoles: Role[] = []) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // If we're still loading or not authenticated, access is denied
  if (isLoading || !isAuthenticated) {
    return { hasAccess: false, isLoading };
  }
  
  // If no roles specified, any authenticated user has access
  if (allowedRoles.length === 0) {
    return { hasAccess: true, isLoading: false };
  }
  
  // Check if user role is in the allowed roles
  const hasAccess = user ? allowedRoles.includes(user.role as Role) : false;
  
  return { hasAccess, isLoading: false };
}