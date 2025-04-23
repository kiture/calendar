import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  selectIsLoggedIn,
  selectUserIsAdmin,
} from '../../redux/user/user.selectors';
import {
  selectSelectedGroupName,
  selectUserGroups,
} from '../../redux/group/group.selectors';
import { logoutUser } from '../../redux/user/user.reducer';
import { AppDispatch } from '../../redux/store';

// Placeholder Top Navigation Bar
export function TopNavBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  // Placeholder state/logic - replace with Redux later
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(selectUserIsAdmin);
  const activeGroupName = useSelector(selectSelectedGroupName); // Placeholder
  const userGroups = useSelector(selectUserGroups); // Placeholder

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          AI Calendar
        </Link>

        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            {/* Placeholder Group Selector - Needs Dropdown logic */}
            {userGroups?.length > 1 && (
              <div className="relative">
                <button className="hover:bg-blue-700 px-3 py-1 rounded">
                  {activeGroupName} ▾
                </button>
                {/* Dropdown content here */}
              </div>
            )}

            <Link to="/" className="hover:bg-blue-700 px-3 py-1 rounded">
              Kalendarz
            </Link>
            <Link
              to="/my-events"
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Moje Wydarzenia
            </Link>
            <Link
              to="/ai-suggestions"
              className="hover:bg-blue-700 px-3 py-1 rounded"
            >
              Sugestie AI
            </Link>

            {isAdmin && (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost rounded-btn">
                  Admin{' '}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-1 inline-block"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content p-2 shadow bg-base-100 text-black rounded-box w-52 mt-4 z-[1]"
                >
                  <li>
                    <Link to="/admin/users">Manage Users</Link>
                  </li>
                  <li>
                    <Link to="/admin/groups">Manage Groups</Link>
                  </li>
                </ul>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
