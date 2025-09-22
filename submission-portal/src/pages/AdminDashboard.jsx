import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";

const RATERS = ["Vrishank", "Raushan", "Priyanshu", "Vishwanath", "Niyati", "Balaji"];

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [ratingValues, setRatingValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    // Listen for real-time updates to the submissions collection
    const unsub = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by submission time to ensure consistent assignment order
      data.sort((a, b) => a.submittedAt?.toMillis() - b.submittedAt?.toMillis());
      
      setSubmissions(data);

      // Initialize rating values from fetched data
      const initialRatings = {};
      data.forEach(sub => {
        initialRatings[sub.id] = sub.rating || "";
      });
      setRatingValues(initialRatings);
      
      setLoading(false);
    });

    return () => unsub(); // Unsubscribe on component unmount
  }, []);

  const assignRatings = async () => {
    setAssigning(true);
    const unassigned = submissions.filter(s => !s.assignedRater);

    if (unassigned.length === 0) {
      alert("No new submissions to assign.");
      setAssigning(false);
      return;
    }

    // To ensure even distribution, find the rater with the fewest assignments
    const counts = RATERS.reduce((acc, rater) => {
        acc[rater] = submissions.filter(s => s.assignedRater === rater).length;
        return acc;
    }, {});
    
    RATERS.sort((a, b) => counts[a] - counts[b]); // Sort raters by current workload
    
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
    const rating = ratingValues[id];
    if (!rating || rating < 1 || rating > 10) {
      return alert("Please enter a valid rating between 1 and 10.");
    }
    
    const subDocRef = doc(db, "submissions", id);
    try {
      await updateDoc(subDocRef, { rating: Number(rating) });
      alert("Rating saved successfully!");
    } catch (error) {
      console.error("Error saving rating: ", error);
      alert("Failed to save rating.");
    }
  };

  // Group submissions by rater for display
  const groupedByRater = submissions.reduce((acc, sub) => {
    const rater = sub.assignedRater || "Unassigned";
    if (!acc[rater]) acc[rater] = [];
    acc[rater].push(sub);
    return acc;
  }, {});
  
  const displayOrder = ["Unassigned", ...RATERS];

  if (loading) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={assignRatings}
            disabled={assigning}
            className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? "Assigning..." : `Assign New Submissions (${groupedByRater["Unassigned"]?.length || 0})`}
          </button>
        </div>

        <div className="space-y-8">
          {displayOrder.map(rater => groupedByRater[rater] && (
            <div key={rater} className="p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-700">
                {rater}'s Submissions ({groupedByRater[rater].length})
              </h2>
              {groupedByRater[rater].length === 0 ? (
                <p className="text-gray-500">No submissions found.</p>
              ) : (
                <div className="space-y-4">
                  {groupedByRater[rater].map(sub => (
                    <div key={sub.id} className="p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold text-lg">{sub.teamName} (Team #{sub.teamNumber})</p>
                        <a href={sub.fileURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Submission: {sub.fileName}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="1-10"
                          value={ratingValues[sub.id] || ""}
                          onChange={(e) => handleRatingChange(sub.id, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => handleRatingSave(sub.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                        >
                          Save
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