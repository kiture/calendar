import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsLoggedIn } from '../../redux/user/user.selectors';


export function ProtectedRoute() {
  // Check authentication status using the selector
  const isAuthenticated = useSelector(selectIsLoggedIn);

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login page.
    // `replace` prevents adding the login route to the browser history stack.
    return <Navigate to="/auth/login" replace />;
  }

  // User is authenticated, render the nested routes via Outlet.
  return <Outlet />;
} 