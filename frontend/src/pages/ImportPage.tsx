import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { previewCSV, confirmImport } from "../services/api";

type Step = "upload" | "preview" | "mapping" | "done";

export default function ImportPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<any>(null);
  const [fileContent, setFileContent] = useState("");
  const [mapping, setMapping] = useState({
  date_col: 0, amount_col: 1, merchant_col: 2,
  debit_col: -1, credit_col: -1
});
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const previewMut = useMutation({
    mutationFn: previewCSV,
    onSuccess: (data) => {
      setPreview(data);
      setMapping({
        date_col: data.detected.date_col ?? 0,
        amount_col: data.detected.amount_col ?? 1,
        merchant_col: data.detected.merchant_col ?? 2,
      });
      setStep("preview");
    },
  });

  const confirmMut = useMutation({
    mutationFn: confirmImport,
    onSuccess: (data) => {
      setResult(data);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
    },
  });

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileContent(text);
    previewMut.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Import bank statement</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Upload any CSV — columns are auto-detected
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {["upload", "preview", "mapping", "done"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${step === s ? "bg-gray-900 text-white"
                : ["upload","preview","mapping","done"].indexOf(step) > i
                ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {["upload","preview","mapping","done"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            <span className="text-xs text-gray-500 capitalize">{s}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors
            ${dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}
        >
          <p className="text-sm font-medium text-gray-700">
            {previewMut.isPending ? "Analysing…" : "Drop your CSV here or click to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Works with HDFC, ICICI, Axis, Kotak, any bank CSV export
          </p>
          <input
            ref={fileRef} type="file" accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Step 2: Preview + Column Mapping */}
      {step === "preview" && preview && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-sm font-medium text-emerald-700">
              {preview.filename} — {preview.total_rows} rows detected
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Columns auto-detected. Adjust below if incorrect.
            </p>
          </div>

          {/* Column mapping */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-medium text-gray-700">Column mapping</h2>
            {[
              { label: "Date column", key: "date_col" },
              { label: "Amount column", key: "amount_col" },
              { label: "Debit column (optional)", key: "debit_col" },
              { label: "Credit column (optional)", key: "credit_col" },
              { label: "Merchant / Description column", key: "merchant_col" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-xs text-gray-600 w-48">{label}</span>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  value={(mapping as any)[key]}
                  onChange={(e) => setMapping((m) => ({ ...m, [key]: Number(e.target.value) }))}
                >
                  {preview.headers.map((h: string, i: number) => (
                    <option key={i} value={i}>{i}: {h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Preview (first 5 rows)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {preview.headers.map((h: string, i: number) => (
                      <th key={i} className="text-left py-2 pr-4 text-gray-500 font-medium">
                        {h}
                        {i === mapping.date_col && " 📅"}
                        {i === mapping.amount_col && " 💰"}
                        {i === mapping.merchant_col && " 🏪"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.preview.map((row: any, i: number) => (
                    <tr key={i}>
                      {preview.headers.map((h: string, j: number) => (
                        <td key={j} className="py-2 pr-4 text-gray-600">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => confirmMut.mutate({ content: fileContent, ...mapping })}
              disabled={confirmMut.isPending}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-800"
            >
              {confirmMut.isPending
                ? "Importing…"
                : `Import ${preview.total_rows} transactions`}
            </button>
          </div>

          {confirmMut.isError && (
            <p className="text-xs text-red-500">Import failed. Check column mapping.</p>
          )}
        </div>
      )}

      {/* Step 3: Done */}
      {step === "done" && result && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-emerald-600 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{result.message}</h2>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-semibold text-emerald-600">{result.inserted}</p>
              <p className="text-xs text-gray-400">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-500">{result.failed}</p>
              <p className="text-xs text-gray-400">Failed</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left bg-gray-50 rounded-lg p-3 mt-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Errors:</p>
              {result.errors.map((e: string, i: number) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}
          <button
            onClick={() => { setStep("upload"); setPreview(null); setResult(null); }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}