import { useState } from "react";
import axios from "axios";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Sun, Moon, UploadCloud, FileUp, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const TEAMS_API_URL = "https://september-freshers-mztb.onrender.com/api/teams/summary";
const EMAIL_SERVER_URL = "https://android-club-submission-portal.onrender.com"; 

export default function StudentUpload() {
  const [teamName, setTeamName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(true);

  // --- Themeing Logic ---
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
    bg: isDark ? "bg-gradient-to-br from-gray-900 via-black to-gray-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    text: isDark ? "text-white" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark ? "bg-black/90 backdrop-blur-lg border-gray-800" : "bg-white/80 backdrop-blur-lg border-gray-200",
    input: isDark ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500',
  };
  // --- End of Themeing Logic ---

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 20MB in bytes (1024 * 1024 * 20)
      const maxSizeInBytes = 20971520;
      if (selectedFile.size > maxSizeInBytes) {
        setStatus("error");
        setMessage("File is too large. Maximum size is 20MB.");
        setFile(null);
        e.target.value = ""; // Reset the file input visually
      } else {
        setFile(selectedFile);
        setStatus("idle"); // Clear any previous error messages
        setMessage("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!teamName || !teamNumber || !file) {
      setMessage("Please fill all fields and select a file.");
      setStatus("error");
      return;
    }

    setStatus("validating");
    setMessage("Validating team information...");

    try {
      // Step 1: Validate Team
      const response = await axios.get(TEAMS_API_URL);
      const registeredTeam = response.data.data.find(
        (team) => team.teamId.toLowerCase() === teamNumber.toLowerCase()
      );

      if (!registeredTeam) {
        setMessage("Invalid Team ID. Please check your ID and try again.");
        setStatus("error");
        return;
      }

      if (registeredTeam.teamName.toLowerCase() !== teamName.toLowerCase()) {
        setMessage("Team Name does not match the registered name for this Team ID.");
        setStatus("error");
        return;
      }
      
      // Step 2: Check for previous submissions
      setMessage("Checking for previous submissions...");
      const submissionsRef = collection(db, "submissions");
      const q = query(submissionsRef, where("teamNumber", "==", teamNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setMessage("This team has already submitted a project. Multiple submissions are not allowed.");
        setStatus("error");
        return;
      }

      const { leaderEmail } = registeredTeam;

      // Step 3: Upload file
      setStatus("uploading");
      setMessage("Validation successful. Uploading file...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      // formData.append("resource_type", "auto"); // This line is not needed when using a specific endpoint like /raw/upload

      // FIX: Changed the endpoint from `/auto/upload` to `/raw/upload`
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/raw/upload`,
        formData
      );
      const fileURL = res.data.secure_url;

      // Step 4: Save to Firestore
      setMessage("Saving submission details...");
      await addDoc(collection(db, "submissions"), {
        teamName, teamNumber, leaderEmail, fileURL,
        fileName: file.name,
        assignedRater: null, rating: null,
        submittedAt: serverTimestamp(),
      });
      
      // Step 5: Send confirmation email (NON-BLOCKING)
      await axios.post(`${EMAIL_SERVER_URL}/send-confirmation`, {
        teamName, leaderEmail,
      }).catch(err => {
        // The .catch is still good to have for logging errors
        console.error("Failed to send confirmation email:", err);
      });

      setStatus("success");
      setMessage("Submission successful! A confirmation email has been sent.");
      setTeamName("");
      setTeamNumber("");
      setFile(null);
      if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = "";
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("An error occurred during submission. Please try again.");
    }
  };
  
  const isSubmitting = status === 'validating' || status === 'uploading';

  // Component for displaying status messages
  const StatusMessage = () => {
    if (message && !isSubmitting) {
        const isError = status === 'error';
        const colorClass = isError ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';
        const Icon = isError ? AlertTriangle : CheckCircle2;

        return (
            <div className={`mt-6 p-4 border rounded-xl flex items-center justify-center gap-3 ${colorClass}`}>
                <Icon className="w-5 h-5"/>
                <p className="font-medium">{message}</p>
            </div>
        )
    }
    return null;
  }

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
              {isDark ? <Sun className="w-5 h-5 text-gray-900" /> : <Moon className="w-5 h-5 text-gray-900" />}
            </div>
          </button>
        </div>

        <div className={`relative z-10 ${themeClasses.card} p-8 rounded-3xl shadow-2xl max-w-md w-full border backdrop-blur-lg animate-slide-up`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-500/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-400/20">
                <UploadCloud className="w-10 h-10 text-green-400" />
              </div>
              <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
                Submit Your Project
              </h1>
              <p className={`${themeClasses.textMuted}`}>
                September Sprint 2025
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Name"
                className={`w-full px-5 py-3 ${themeClasses.input} border rounded-xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 transition-all duration-300 backdrop-blur-sm`}
              />
              <input
                type="text"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                placeholder="Team ID (e.g., SS-101)"
                className={`w-full px-5 py-3 ${themeClasses.input} border rounded-xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 transition-all duration-300 backdrop-blur-sm`}
              />
              
              <label htmlFor="file-input" className={`w-full px-5 py-3 ${themeClasses.input} border rounded-xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 transition-all duration-300 backdrop-blur-sm flex items-center justify-between cursor-pointer`}>
                <span className={`${file ? themeClasses.text : themeClasses.textMuted}`}>{file ? file.name : "Select presentation file..."}</span>
                <FileUp className="text-green-400"/>
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group relative w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-400 to-green-500 text-gray-900 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin"/>
                    {message}
                  </>
                ) : (
                  "Submit Project"
                )}
              </span>
            </button>
            <StatusMessage />
          </div>
        </div>
      </div>
    </>
  );
}
