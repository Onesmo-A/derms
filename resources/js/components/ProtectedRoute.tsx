import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/rtk';
import { selectCurrentUser, selectIsAuthenticated } from '@/features/auth/authSlice';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const currentUser = useAppSelector(selectCurrentUser);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};
