import { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.NEXT_BACKEND_URL || "http://localhost:5000";

const UploadFiles = () => {
  const [files, setFiles] = useState<File[]>([]);

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [status, setStatus] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return setStatus("Please select files first");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (title) formData.append("title", title);
    if (unlockDate) formData.append("unlockDate", unlockDate);
    if (description) formData.append("description", description);

    try {
      const res = await axios.post(
        `${API_BASE}/api/capsules/upload`,
        formData,
      );

      const data = res.data;
      setStatus(`Upload successful! Capsule ID: ${data.id}`);
    } catch (err: any) {
      setStatus(`Upload failed: ${err?.response?.data?.error || err.message}`);
    }
  };

  return (
    <div>
      <h1>Upload files to your capsule!</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} /><br/>
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /><br/>
        <input type="datetime-local" placeholder="Unlock Date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} /><br/>
        <input type="file" multiple onChange={handleFileChange} /><br/>
        <button type="submit">Upload</button>
      </form>
      <p>{status}</p>
    </div>
  );
};

export default UploadFiles;

