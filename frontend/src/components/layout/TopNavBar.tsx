import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  selectIsLoggedIn,
  selectUserIsAdmin,
} from '../../redux/user/user.selectors';
import { logoutUser } from '../../redux/user/user.reducer';
import { AppDispatch } from '../../redux/store';
import { useState } from 'react';

// Placeholder Top Navigation Bar
export function TopNavBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  // Placeholder state/logic - replace with Redux later
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(selectUserIsAdmin);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {isAuthenticated && (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 focus:outline-none mr-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <Link to="/" className="text-xl font-bold">
            AI Calendar
          </Link>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-blue-600 text-white transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-50`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col space-y-4 px-4 py-2">
          <li>
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Kalendarz
            </Link>
          </li>
          <li>
            <Link
              to="/my-events"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Moje Wydarzenia
            </Link>
          </li>
          <li>
            <Link
              to="/groups"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Groups
            </Link>
          </li>
          <li>
            <Link
              to="/ai-suggestions"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Sugestie AI
            </Link>
          </li>
          {isAdmin && (
            <li>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setAdminMenuOpen(!adminMenuOpen);
                  }}
                  className="hover:bg-blue-700 px-3 py-1 rounded w-full text-left flex items-center justify-between"
                >
                  Admin Panel
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <ul
                  className={`pl-4 space-y-2 mt-2 overflow-hidden transition-all duration-200 ${adminMenuOpen ? 'max-h-40' : 'max-h-0'}`}
                >
                  <li>
                    <Link
                      to="/admin/users"
                      onClick={() => setMenuOpen(false)}
                      className="hover:bg-blue-700 px-3 py-1 rounded block"
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/groups"
                      onClick={() => setMenuOpen(false)}
                      className="hover:bg-blue-700 px-3 py-1 rounded block"
                    >
                      Manage Groups
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          )}
          <li>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded w-full text-left"
            >
              Wyloguj
            </button>
          </li>
        </ul>
      </div>
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}
