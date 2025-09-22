import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import StudentUpload from "./pages/StudentUpload";
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/AdminDashboard"; // Ensure this is imported
import LeaderboardPage from "./pages/LeaderboardPage"; // Import the new page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/student" />} />
        <Route path="/student" element={<StudentUpload />} />

        {/* Admin routes are now nested */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;