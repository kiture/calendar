import { Outlet } from 'react-router-dom';
import { TopNavBar } from '../views/shared/TopNavBar';
import { Footer } from '../views/shared/Footer';

// Main Layout for authenticated users
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavBar />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
