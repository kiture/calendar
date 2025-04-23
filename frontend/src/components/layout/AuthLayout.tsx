import { Outlet } from 'react-router-dom';

// Auth Layout for login/register pages
export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <main className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <Outlet />
      </main>
    </div>
  );
}
