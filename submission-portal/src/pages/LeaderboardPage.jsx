import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useOutletContext } from "react-router-dom";
import { Download, Trophy, Loader2 } from "lucide-react";

const RATERS = ["Vrishank", "Raushan", "Priyanshu", "Vishwanath", "Niyati", "Balaji"];

export default function LeaderboardPage() {
  // Receive the isDark state from the parent AdminPage's context
  const { isDark } = useOutletContext();
  
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);

  // Theme classes derived from the parent's theme
  const themeClasses = {
    text: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark
      ? "bg-black/80 backdrop-blur-lg border-gray-800"
      : "bg-white/80 backdrop-blur-lg border-gray-200",
    ratingBadge: isDark
      ? "bg-green-400/10 text-green-300"
      : "bg-green-100 text-green-800",
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const topRatedByRater = {};

      for (const rater of RATERS) {
        topRatedByRater[rater] = submissions
          .filter(sub => sub.assignedRater === rater && sub.rating != null)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);
      }
      
      setLeaderboards(topRatedByRater);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleExportToCsv = () => {
    if (Object.keys(leaderboards).length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Rater", "Rank", "TeamName", "TeamNumber", "Rating", "LeaderEmail"];
    let csvContent = headers.join(",") + "\n";

    for (const rater of RATERS) {
      const topTeams = leaderboards[rater] || [];
      if (topTeams.length > 0) {
        topTeams.forEach((team, index) => {
          const teamName = `"${team.teamName}"`; 
          const leaderEmail = team.leaderEmail || ""; 
          
          const row = [
            rater,
            index + 1,
            teamName,
            team.teamNumber,
            team.rating,
            leaderEmail,
          ].join(",");
          csvContent += row + "\n";
        });
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "rater_leaderboards_with_emails.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-96 ${themeClasses.textSecondary}`}>
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading Leaderboards...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text}`}>Rater Leaderboards</h1>
          <button
            onClick={handleExportToCsv}
            disabled={loading}
            className="group relative mt-4 md:mt-0 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-gray-900 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Download size={18} />
              Export to CSV
            </span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {RATERS.map((rater, raterIndex) => (
            <div 
              key={rater} 
              className={`relative p-6 ${themeClasses.card} rounded-3xl border shadow-2xl animate-slide-up`}
              style={{ animationDelay: `${100 + raterIndex * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-green-500/5 rounded-3xl"></div>
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center gap-3 text-green-400`}>
                <Trophy />
                {rater}'s Top Teams
              </h2>
              {leaderboards[rater] && leaderboards[rater].length > 0 ? (
                <ol className="space-y-4">
                  {leaderboards[rater].map((sub, index) => (
                    <li key={sub.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className={`text-xl font-bold ${themeClasses.textMuted}`}>
                          {index + 1}.
                        </span>
                        <div>
                          <p className={`font-semibold text-lg ${themeClasses.text}`}>{sub.teamName}</p>
                          <p className={`text-sm ${themeClasses.textMuted}`}>Team #{sub.teamNumber}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 ${themeClasses.ratingBadge} rounded-full font-bold text-md`}>
                        {sub.rating}/10
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={`${themeClasses.textMuted} mt-4`}>
                  No rated submissions found for this rater yet.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}