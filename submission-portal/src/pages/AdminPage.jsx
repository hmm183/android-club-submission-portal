import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import AdminDashboard from "./AdminDashboard"; // This can be removed if not directly used

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(
    sessionStorage.getItem("isAdminAuthorized") === "true"
  );
  const [error, setError] = useState("");
  const location = useLocation();

  const handleLogin = () => {
    if (passwordInput === process.env.REACT_APP_ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdminAuthorized", "true");
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  // If not authorized, show the login form
  if (!isAuthorized) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Admin Access</h1>
            <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 transition"
            />
            <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 font-semibold"
            >
                Login
            </button>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </div>
        </div>
    );
  }

  // If authorized, show the Admin Layout with Navigation
  const getLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`;
  
  return (
    <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                <div className="flex items-center gap-4">
                    <NavLink to="/admin/dashboard" className={getLinkClass}>Dashboard</NavLink>
                    <NavLink to="/admin/leaderboard" className={getLinkClass}>Leaderboard</NavLink>
                </div>
            </nav>
        </header>
        <main>
            {/* The Outlet will render either the Dashboard or Leaderboard component */}
            <Outlet />
        </main>
    </div>
  );
}