import { useState } from "react";
import axios from "axios";
// NEW: Import the functions needed to query Firestore
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const TEAMS_API_URL = "https://september-freshers-mztb.onrender.com/api/teams/summary";
const EMAIL_SERVER_URL = "https://android-club-submission-portal.onrender.com"; 

export default function StudentUpload() {
  const [teamName, setTeamName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!teamName || !teamNumber || !file) {
      setMessage("Please fill all fields and select a file.");
      setStatus("error");
      return;
    }

    setStatus("validating");
    setMessage("Validating team information...");

    try {
      // Step 1: Validate Team ID and Team Name against the API
      const response = await axios.get(TEAMS_API_URL);
      const registeredTeam = response.data.data.find(
        (team) => team.teamId.toLowerCase() === teamNumber.toLowerCase()
      );

      // Check if team ID exists
      if (!registeredTeam) {
        setMessage("Invalid Team ID. Please check your ID and try again.");
        setStatus("error");
        return;
      }

      // NEW: Add a case-insensitive check for the Team Name
      if (registeredTeam.teamName.toLowerCase() !== teamName.toLowerCase()) {
        setMessage("Team Name does not match the registered name for this Team ID.");
        setStatus("error");
        return;
      }
      
      // NEW: Step 2: Check if this team has already submitted in Firestore
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

      // Step 3: Upload file to Cloudinary
      setStatus("uploading");
      setMessage("Validation successful. Uploading file...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
        formData
      );
      const fileURL = res.data.secure_url;

      // Step 4: Save submission to Firestore
      setMessage("Saving submission details...");
      await addDoc(collection(db, "submissions"), {
        teamName,
        teamNumber,
        leaderEmail,
        fileURL,
        fileName: file.name,
        assignedRater: null,
        rating: null,
        submittedAt: serverTimestamp(),
      });
      
      // Step 5: Call your backend to send the confirmation email
      await axios.post(`${EMAIL_SERVER_URL}/send-confirmation`, {
        teamName,
        leaderEmail,
      });

      setStatus("success");
      setMessage("Submission successful! A confirmation email has been sent.");
      // Reset form
      setTeamName("");
      setTeamNumber("");
      setFile(null);
      document.getElementById('file-input').value = "";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("An error occurred during submission. Please try again.");
    }
  };
  
  const isSubmitting = status === 'validating' || status === 'uploading';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Submit Your Project</h1>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name"
          className="w-full px-4 py-2 mb-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={teamNumber}
          onChange={(e) => setTeamNumber(e.target.value)}
          placeholder="Team ID (e.g., SS-101)"
          className="w-full px-4 py-2 mb-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <input
          id="file-input"
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
        >
          {isSubmitting ? message : "Submit"}
        </button>
        {message && !isSubmitting && (
          <p className={`mt-4 text-center ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}