import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Sun, Moon, Shield, BarChart3, Trophy, LogOut } from "lucide-react";

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(
    sessionStorage.getItem("isAdminAuthorized") === "true"
  );
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Replace with your actual password check logic
    if (passwordInput === process.env.REACT_APP_ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdminAuthorized", "true");
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminAuthorized");
    setIsAuthorized(false);
    setPasswordInput("");
    setError("");
  };

  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      stars.push(
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div className="w-1 h-1 bg-green-400 rounded-full shadow-sm shadow-green-400/50"></div>
        </div>
      );
    }
    return stars;
  };

  const themeClasses = {
    bg: isDark
      ? "bg-gradient-to-br from-gray-900 via-black to-gray-900"
      : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    text: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark
      ? "bg-black/90 backdrop-blur-lg border-gray-800"
      : "bg-white/80 backdrop-blur-lg border-gray-200",
    nav: isDark
      ? "bg-black/80 backdrop-blur-lg border-gray-800"
      : "bg-white/80 backdrop-blur-lg border-gray-200",
  };

  if (!isAuthorized) {
    return (
      <>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <div
          className={`min-h-screen ${themeClasses.bg} overflow-hidden relative transition-all duration-700 ease-in-out flex items-center justify-center p-4`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {isDark && (
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {generateStars()}
            </div>
          )}

          <div className="fixed top-6 right-6 z-50">
            <button
              onClick={() => setIsDark(!isDark)}
              className="group relative w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-500 animate-pulse opacity-50"></div>
              <div className="relative flex items-center justify-center w-full h-full">
                {isDark ? (
                  <Sun className="w-5 h-5 text-gray-900 transition-transform duration-300 group-hover:rotate-12" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-900 transition-transform duration-300 group-hover:rotate-12" />
                )}
              </div>
            </button>
          </div>

          <div className={`relative z-10 ${themeClasses.card} p-8 rounded-3xl shadow-2xl max-w-md w-full border backdrop-blur-lg animate-slide-up`}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-500/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-400/20">
                  <Shield className="w-10 h-10 text-green-400" />
                </div>
                <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
                  Admin Access
                </h1>
                <p className={`${themeClasses.textMuted}`}>
                  Enter your credentials to continue
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                  placeholder="Enter admin password"
                  className={`w-full px-6 py-4 ${isDark ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 transition-all duration-300 backdrop-blur-sm`}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-green-400 to-green-500 text-gray-900 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    'Login'
                  )}
                </span>
              </button>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-slide-up">
                  <p className="text-red-400 text-center font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  const getLinkClass = ({ isActive }) =>
    `group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 ${
      isActive
        ? 'bg-gradient-to-r from-green-400 to-green-500 text-gray-900 shadow-lg shadow-green-500/30'
        : `${themeClasses.textSecondary} hover:bg-green-400/10 hover:text-green-400`
    }`;
  
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div 
        className={`min-h-screen ${themeClasses.bg} transition-all duration-700 ease-in-out`}
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {isDark && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {generateStars()}
          </div>
        )}

        <header className={`sticky top-0 z-40 ${themeClasses.nav} border-b backdrop-blur-lg`}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-green-400/20">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                    Admin Panel
                  </h1>
                  <p className={`text-sm ${themeClasses.textMuted}`}>
                    Android Club VIT-AP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NavLink to="/admin/dashboard" className={getLinkClass}>
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </NavLink>
                <NavLink to="/admin/leaderboard" className={getLinkClass}>
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </NavLink>
                
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="group relative w-10 h-10 rounded-lg bg-gradient-to-r from-green-400/10 to-green-500/10 hover:from-green-400/20 hover:to-green-500/20 transition-all duration-300 hover:scale-110 active:scale-95 ml-2"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-green-400 transition-transform duration-300 group-hover:rotate-12 m-auto" />
                  ) : (
                    <Moon className="w-5 h-5 text-green-400 transition-transform duration-300 group-hover:rotate-12 m-auto" />
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className={`group relative px-4 py-2 rounded-lg ${themeClasses.textMuted} hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 flex items-center gap-2 ml-2`}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main className="relative z-10">
          <Outlet context={{ isDark }} />
        </main>

        <style jsx>{`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slide-up {
            opacity: 0;
            animation: slide-up 0.8s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
}