import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Make sure this list is consistent with your AdminDashboard
const RATERS = ["Vrishank", "Raushan", "Priyanshu", "Vishwanath", "Niyati", "Balaji"];

export default function LeaderboardPage() {
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const topRatedByRater = {};

      for (const rater of RATERS) {
        topRatedByRater[rater] = submissions
          // 1. Filter submissions assigned to the current rater that have a rating
          .filter(sub => sub.assignedRater === rater && sub.rating != null)
          // 2. Sort those submissions by rating in descending order
          .sort((a, b) => b.rating - a.rating)
          // 3. Take the first 5 entries from the sorted list
          .slice(0, 5);
      }
      
      setLeaderboards(topRatedByRater);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="text-center p-10 font-semibold text-gray-600">Loading Leaderboards...</div>;
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Rater Leaderboards</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {RATERS.map(rater => (
            <div key={rater} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold mb-4 text-indigo-600 border-b-2 border-indigo-200 pb-2">{rater}'s Top Teams</h2>
              {leaderboards[rater] && leaderboards[rater].length > 0 ? (
                <ol className="list-decimal list-inside space-y-4 text-gray-700">
                  {leaderboards[rater].map((sub, index) => (
                    <li key={sub.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-lg">{index + 1}. {sub.teamName}</span>
                        <p className="text-sm text-gray-500">Team #{sub.teamNumber}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-md">
                        {sub.rating}/10
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500 mt-4">No rated submissions found for this rater yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}