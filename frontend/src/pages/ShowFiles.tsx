import { useEffect, useState } from "react";

interface FileMeta {
  originalName: string;
  blobName: string;
  contentType: string;
  size: number;
  signedUrl?: string;
  capsuleTitle: string;
  unlocked: boolean;
  unlockDate: string;
}

const ShowFiles = () => {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:5000";
  const apiToken = "";

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/capsules`);

        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const data = await res.json();
        const allFiles: FileMeta[] = data.flatMap((cap: any) =>
          cap.files.map((f: any) => ({
            ...f,
            capsuleTitle: cap.title,
            unlocked: new Date(cap.unlockDate) <= new Date(),
            unlockDate: cap.unlockDate,
          }))
        );

        setFiles(allFiles);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [backendUrl, apiToken]);

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>jit tripping- {error}</p>;
  if (!files.length) return <p>No files available.</p>;

  return (
    <div>
      <h2>Your Capsule:</h2>
      <ul>
        {files.map((file) => (
          <li key={file.blobName}>
            <strong>{file.originalName}</strong> ({file.size} bytes) – 
            capsule: <em>{file.capsuleTitle}</em> –{" "}
            {file.unlocked ? (
              <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            ) : (
              <span style={{ color: "gray", fontStyle: "italic" }}>
                Locked until {new Date(file.unlockDate).toLocaleString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShowFiles;

