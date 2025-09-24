import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { useOutletContext } from "react-router-dom";
import { Users, FileText, Save, Loader2, UserCheck } from "lucide-react";

const RATERS = ["Vrishank", "Raushan", "Priyanshu", "Vishwanath", "Niyati", "Balaji"];

export default function AdminDashboard() {
  const { isDark } = useOutletContext();

  const [submissions, setSubmissions] = useState([]);
  const [ratingValues, setRatingValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const themeClasses = {
    text: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark
      ? "bg-black/80 backdrop-blur-lg border-gray-800"
      : "bg-white/80 backdrop-blur-lg border-gray-200",
    input: isDark
      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
      : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500'
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.submittedAt?.toMillis() - b.submittedAt?.toMillis());
      
      setSubmissions(data);

      const initialRatings = {};
      data.forEach(sub => {
        initialRatings[sub.id] = sub.rating || "";
      });
      setRatingValues(initialRatings);
      
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const assignRatings = async () => {
    setAssigning(true);
    const unassigned = submissions.filter(s => !s.assignedRater);

    if (unassigned.length === 0) {
      alert("No new submissions to assign.");
      setAssigning(false);
      return;
    }

    const counts = RATERS.reduce((acc, rater) => {
        acc[rater] = submissions.filter(s => s.assignedRater === rater).length;
        return acc;
    }, {});
    
    RATERS.sort((a, b) => counts[a] - counts[b]);
    
    let raterIndex = 0;
    const promises = unassigned.map(sub => {
      const rater = RATERS[raterIndex];
      raterIndex = (raterIndex + 1) % RATERS.length;
      return updateDoc(doc(db, "submissions", sub.id), { assignedRater: rater });
    });

    await Promise.all(promises);
    alert(`${unassigned.length} new submission(s) have been assigned!`);
    setAssigning(false);
  };

  const handleRatingChange = (id, value) => {
    setRatingValues(prev => ({ ...prev, [id]: value }));
  };

  const handleRatingSave = async (id) => {
    setSavingId(id);
    const rating = ratingValues[id];
    if (!rating || rating < 1 || rating > 10) {
      setSavingId(null);
      return alert("Please enter a valid rating between 1 and 10.");
    }
    
    const subDocRef = doc(db, "submissions", id);
    try {
      await updateDoc(subDocRef, { rating: Number(rating) });
    } catch (error) {
      console.error("Error saving rating: ", error);
      alert("Failed to save rating.");
    } finally {
      setSavingId(null);
    }
  };

  const groupedByRater = submissions.reduce((acc, sub) => {
    const rater = sub.assignedRater || "Unassigned";
    if (!acc[rater]) acc[rater] = [];
    acc[rater].push(sub);
    return acc;
  }, {});
  
  const displayOrder = ["Unassigned", ...RATERS];

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-96 ${themeClasses.textSecondary}`}>
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text}`}>Submissions Dashboard</h1>
          <button
            onClick={assignRatings}
            disabled={assigning}
            className="group relative mt-4 md:mt-0 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-gray-900 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {assigning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin"/>
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5"/>
                  {`Assign New (${groupedByRater["Unassigned"]?.length || 0})`}
                </>
              )}
            </span>
          </button>
        </div>

        <div className="space-y-8">
          {displayOrder.map(rater => groupedByRater[rater] && (
            <div key={rater} className={`relative p-6 ${themeClasses.card} rounded-3xl border shadow-2xl animate-slide-up`}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-green-500/5 rounded-3xl"></div>
              <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${themeClasses.text}`}>
                <UserCheck className="text-green-400"/>
                {rater}'s Submissions ({groupedByRater[rater].length})
              </h2>
              {groupedByRater[rater].length === 0 ? (
                <p className={`${themeClasses.textMuted}`}>No submissions found.</p>
              ) : (
                <div className="space-y-4">
                  {groupedByRater[rater].map(sub => (
                    <div key={sub.id} className={`p-4 border ${isDark ? 'border-gray-800' : 'border-gray-200'} rounded-xl flex flex-col md:flex-row justify-between items-center gap-4`}>
                      <div className="flex-grow">
                        <p className={`font-semibold text-lg ${themeClasses.text}`}>{sub.teamName} (Team #{sub.teamNumber})</p>
                        <a href={sub.fileURL} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline flex items-center gap-2 text-sm">
                          <FileText size={16}/>
                          View Submission: {sub.fileName}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="1-10"
                          value={ratingValues[sub.id] || ""}
                          onChange={(e) => handleRatingChange(sub.id, e.target.value)}
                          className={`w-24 px-3 py-2 ${themeClasses.input} border rounded-xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 transition-all duration-300 backdrop-blur-sm`}
                        />
                        <button
                          onClick={() => handleRatingSave(sub.id)}
                          disabled={savingId === sub.id}
                          className="w-24 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition flex items-center justify-center font-semibold disabled:bg-green-800"
                        >
                          {savingId === sub.id ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save size={16} className="mr-1.5"/> Save</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}