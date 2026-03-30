import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard";
import AnomalyPage from "./pages/AnomalyPage";
import "./index.css";
import ImportPage from "./pages/ImportPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

function App() {
  const [page, setPage] = useState("dashboard");
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-base font-semibold text-gray-900">AutoLedger</span>
            <span className="ml-2 text-xs text-gray-400">Financial intelligence</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage("dashboard")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors
                ${page === "dashboard" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setPage("anomalies")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors
                ${page === "anomalies" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              Anomalies
              </button>
              <button
  onClick={() => setPage("import")}
  className={`text-xs px-3 py-1.5 rounded-lg transition-colors
    ${page === "import" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
>
  Import CSV
</button>
            
          </div>
        </div>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
          className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          API docs
        </a>
      </nav>
      {page === "dashboard" ? <Dashboard />
  : page === "anomalies" ? <AnomalyPage />
  : <ImportPage />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);