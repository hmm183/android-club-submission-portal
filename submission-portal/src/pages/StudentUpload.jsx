import { useState } from "react";
import axios from "axios";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function StudentUpload() {
  const [teamName, setTeamName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!teamName || !teamNumber || !file) {
      alert("Please fill all fields and select a file.");
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
        formData
      );

      const fileURL = res.data.secure_url;

      // Save submission to Firestore
      await addDoc(collection(db, "submissions"), {
        teamName,
        teamNumber,
        fileURL,
        fileName: file.name,
        assignedRater: null,
        rating: null,
        submittedAt: serverTimestamp(),
      });

      alert("Submission successful!");
      setTeamName("");
      setTeamNumber("");
      setFile(null);
    } catch (error) {
      console.error(error);
      alert("Submission failed.");
    }

    setUploading(false);
  };

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
          placeholder="Team Number"
          className="w-full px-4 py-2 mb-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
