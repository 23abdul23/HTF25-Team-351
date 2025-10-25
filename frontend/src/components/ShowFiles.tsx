import { useEffect, useState } from "react";
const ShowFiles = () => {

  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("Backend URL:", import.meta.env.NEXT_BACKEND_URL);

  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: string[]) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>Error:hahah {error}</p>;

  return (
    <div>
      <h2>Files : </h2>
        <ul>
          {files.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
    </div>
  );
};

export default ShowFiles;
