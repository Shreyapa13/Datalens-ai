import { useState } from "react";
import axios from "axios";
import { UploadCloud } from "lucide-react";

export default function UploadZone({ onComplete }) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    setLoading(true);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/analyze",
        formData
      );

      onComplete(
        response.data
      );

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Upload failed"
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <div className="space-y-6">

      <label
        className="
        group
        flex
        min-h-[300px]
        cursor-pointer
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-dashed
        border-slate-600
        bg-white/5
        p-10
        text-center
        transition
        hover:border-purple-400
        hover:bg-white/10
        "
      >

        <UploadCloud
          size={52}
          className="
          mb-5
          text-purple-400
          transition
          group-hover:scale-110
          "
        />

        <h3 className="text-xl font-semibold">
          Drop your dataset here
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          CSV, XLSX or XLS
        </p>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

      </label>

      {file && (

        <div className="rounded-2xl bg-white/5 p-4">

          <p className="font-medium">
            {file.name}
          </p>

          <p className="text-sm text-slate-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>

        </div>

      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-purple-500
        to-indigo-500
        px-6
        py-4
        font-semibold
        transition
        hover:scale-[1.01]
        disabled:opacity-40
        "
      >

        {loading
          ? "Analyzing dataset..."
          : "Analyze Dataset →"}

      </button>

    </div>
  );
}