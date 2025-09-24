import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { Save, Users, ExternalLink, Download, Loader2 } from "lucide-react";

const RATERS = ["Vrishank", "Raushan", "Priyanshu", "Vishwanath", "Niyati", "Balaji"];

export default function AdminDashboard() {
  const { isDark } = useOutletContext();
  const [submissions, setSubmissions] = useState([]);
  const [ratingValues, setRatingValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  // FIX: State to track the saving status for each individual submission
  const [savingStatus, setSavingStatus] = useState({});

  const getRegNo = (email) => {
    if (!email) return 'N/A';
    const match = email.match(/\.(.*?)@/);
    return match && match[1] ? match[1].toUpperCase() : 'Invalid Email';
  };

  const themeClasses = {
    bg: isDark ? "bg-transparent" : "bg-gray-50",
    card: isDark ? "bg-gray-900/50 border-gray-700" : "bg-white border-gray-200",
    textHeader: isDark ? "text-green-400" : "text-indigo-600",
    textPrimary: isDark ? "text-white" : "text-gray-800",
    textSecondary: isDark ? "text-gray-400" : "text-gray-500",
    input: isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black",
    link: isDark ? "text-green-400 hover:text-green-300" : "text-indigo-600 hover:text-indigo-500",
    badge: isDark ? 'bg-gray-700 text-green-300' : 'bg-gray-200 text-indigo-700',
    fresherBadge: isDark ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' : 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  };

  useEffect(() => {
    // FIX: Added explicit query and ordering
    const q = query(collection(db, "submissions"), orderBy("submittedAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);

      const initialRatings = {};
      data.forEach(sub => { initialRatings[sub.id] = sub.rating || ""; });
      setRatingValues(initialRatings);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const assignRatings = async () => {
    setAssigning(true);
    const unassigned = submissions.filter(s => !s.assignedRater);

    if (unassigned.length === 0) {
      // FIX: Removed disruptive alert
      console.log("No new submissions to assign.");
      setAssigning(false);
      return;
    }

    const counts = RATERS.reduce((acc, rater) => {
        acc[rater] = submissions.filter(s => s.assignedRater === rater).length;
        return acc;
    }, {});
    
    const sortedRaters = [...RATERS].sort((a, b) => counts[a] - counts[b]);
    
    const promises = unassigned.map((sub, index) => {
      const rater = sortedRaters[index % sortedRaters.length];
      return updateDoc(doc(db, "submissions", sub.id), { assignedRater: rater });
    });

    await Promise.all(promises);
    // FIX: Removed disruptive alert
    console.log(`${unassigned.length} new submission(s) have been assigned!`);
    setAssigning(false);
  };

  const handleRatingChange = (id, value) => {
    setRatingValues(prev => ({ ...prev, [id]: value }));
  };

  // FIX: Updated save handler for better UX
  const handleRatingSave = async (id) => {
    const rating = ratingValues[id];
    const originalRating = submissions.find(s => s.id === id)?.rating || "";
    
    // Don't do anything if rating is unchanged
    if (String(rating) === String(originalRating)) {
      return;
    }

    if (rating === "" || rating < 1 || rating > 10) {
      alert("Please enter a valid rating between 1 and 10.");
      return;
    }
    
    setSavingStatus(prev => ({ ...prev, [id]: true })); // Set saving state for this specific item
    
    const subDocRef = doc(db, "submissions", id);
    try {
      await updateDoc(subDocRef, { rating: Number(rating) });
      // No alert needed, success is implied by the button resetting
    } catch (error) {
      console.error("Error saving rating: ", error);
      alert("Failed to save rating."); // Keep alert for errors
    } finally {
      setSavingStatus(prev => ({ ...prev, [id]: false })); // Reset saving state
    }
  };

  // OPTIMIZATION: Memoize the grouping calculation to prevent re-running on every render
  const groupedByRater = useMemo(() => {
    return submissions.reduce((acc, sub) => {
      const rater = sub.assignedRater || "Unassigned";
      if (!acc[rater]) acc[rater] = [];
      acc[rater].push(sub);
      return acc;
    }, {});
  }, [submissions]);
  
  const displayOrder = ["Unassigned", ...RATERS.sort()];

  if (loading) {
    return <div className={`text-center p-10 font-semibold text-lg ${themeClasses.textPrimary}`}>Loading Dashboard...</div>;
  }

  return (
    <div className={`p-6 md:p-10 min-h-screen ${themeClasses.bg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.textPrimary}`}>Submissions Dashboard</h1>
          <button
            onClick={assignRatings}
            disabled={assigning}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-green-500/30 hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {assigning ? "Assigning..." : `Assign New (${groupedByRater["Unassigned"]?.length || 0})`}
          </button>
        </div>

        <div className="space-y-8">
          {displayOrder.map(rater => groupedByRater[rater] && (
            <div key={rater} className={`p-6 rounded-2xl shadow-lg border ${themeClasses.card}`}>
              <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${themeClasses.textHeader}`}>
                <Users />
                {rater}'s Submissions ({groupedByRater[rater].length})
              </h2>
              <div className="space-y-4">
                {groupedByRater[rater].map(sub => {
                  const regNo = getRegNo(sub.leaderEmail);
                  const isFresher = regNo.startsWith('25');
                  
                  return (
                    <div key={sub.id} className={`p-4 border rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <div className="flex-grow w-full md:w-auto">
                        <div className="flex items-center gap-3 mb-2">
                          <p className={`font-semibold text-lg ${themeClasses.textPrimary}`}>{sub.teamName} (Team #{sub.teamNumber})</p>
                          <span className={`px-2 py-1 text-xs font-mono rounded-md ${isFresher ? themeClasses.fresherBadge : themeClasses.badge}`}>
                            {regNo} {isFresher && ' (Fresher)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                           <a 
                             href={`https://docs.google.com/gview?url=${encodeURIComponent(sub.fileURL)}&embedded=true`} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${themeClasses.link}`}
                           >
                             <ExternalLink size={14} /> View Online
                           </a>
                          <a 
                            href={sub.fileURL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${themeClasses.textSecondary} hover:text-green-400`}
                          >
                            <Download size={14} /> {sub.fileName}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="1-10"
                          value={ratingValues[sub.id] || ""}
                          onChange={(e) => handleRatingChange(sub.id, e.target.value)}
                          className={`w-24 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-400/50 ${themeClasses.input}`}
                        />
                        {/* FIX: Updated button with dynamic content and disabled state */}
                        <button
                          onClick={() => handleRatingSave(sub.id)}
                          disabled={savingStatus[sub.id]}
                          className="flex items-center justify-center w-28 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all hover:scale-105 disabled:bg-gray-500 disabled:scale-100"
                        >
                          {savingStatus[sub.id] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                             <><Save size={16} className="mr-2"/> Save</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}