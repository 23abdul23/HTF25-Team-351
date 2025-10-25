import { useState } from "react";

const UploadFiles = () => {
  const [files, setFiles] = useState<File[]>([]);
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

    try {
      const res = await fetch(`${process.env.VITE_PUBLIC_BACKEND_URL}/api/capsules/upload`, {
        method: "POST",
        headers: {
          "x-api-token": "",
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus(`Upload successful! Capsule ID: ${data.id}`);
    } catch (err: any) {
      setStatus(`jit trippin - ${err.message}`);
    }
  };

  return (
    <div>
      <h1>Upload files to your capsule!</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} /><br/>
        <input type="datetime-local" placeholder="Unlock Date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} /><br/>
        <input type="file" multiple onChange={handleFileChange} /><br/>
        <button type="submit">Upload</button>
      </form>
      <p>{status}</p>
    </div>
  );
};

export default UploadFiles;

