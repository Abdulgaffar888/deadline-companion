import { useState } from "react";
import { useDeadlines } from "@/context/DeadlineContext";
import { useToast } from "@/components/Toast";
import { Sparkles, Upload, X, CheckCircle2, ArrowRight, FileText, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analyzeText, analyzePDF } from "@/lib/api";

export default function AddTask() {
  const { addDeadlines } = useDeadlines();
  const { toast }        = useToast();
  const navigate         = useNavigate();

  const [text, setText]       = useState("");
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState<any[]>([]);

  async function analyze() {
    setLoading(true);
    setDetected([]);
    try {
      const data  = file ? await analyzePDF(file) : await analyzeText(text);
      const items = data.items || [];
      setDetected(items);
      if (items.length === 0) {
        toast("No deadlines found in this content.", "info");
      }
    } catch (e) {
      toast("Could not reach the analysis server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    addDeadlines(detected);
    setDetected([]);
    setText("");
    setFile(null);
    toast(`${detected.length} deadline${detected.length !== 1 ? "s" : ""} added successfully.`, "success");
    navigate("/");
  }

  const canAnalyze = !loading && (text.trim().length > 0 || !!file);

  return (
    <div className="min-h-screen bg-app pb-28">

      {/* HEADER */}
      <div
        className="sticky top-0 z-20 px-4 pt-10 pb-4"
        style={{ background: "rgb(var(--bg))", borderBottom: "1px solid rgb(var(--border))" }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: "rgb(var(--accent-2))", color: "rgb(var(--accent))" }}
          >
            GRIK AI
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-primary">
          Extract Deadlines
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          Paste text or upload a PDF — AI will find all deadlines.
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* TEXT INPUT */}
        <div className="card">
          <div
            className="flex items-center gap-2 px-3.5 py-2.5"
            style={{ borderBottom: "1px solid rgb(var(--border))" }}
          >
            <Type size={12} className="text-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted">
              Paste Text
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setFile(null); }}
            placeholder="Paste an email, WhatsApp message, contract clause, audit notice..."
            rows={6}
            className="w-full resize-none bg-transparent text-sm text-primary placeholder:text-muted leading-relaxed focus:outline-none px-3.5 py-3"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgb(var(--border))" }} />
          <span className="text-xs font-mono font-medium text-muted">OR</span>
          <div className="flex-1 h-px" style={{ background: "rgb(var(--border))" }} />
        </div>

        {/* PDF UPLOAD — free for everyone */}
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              setFile(e.target.files?.[0] ?? null);
              setText("");
            }}
          />
          <div
            className="card transition-all active:scale-[0.99]"
            style={{
              borderStyle: "dashed",
              background: file ? "rgba(var(--accent),0.04)" : "rgb(var(--surface))",
              borderColor: file ? "rgb(var(--accent))" : "rgb(var(--border-2))",
            }}
          >
            {file ? (
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgb(var(--accent-2))" }}>
                  <FileText size={16} style={{ color: "rgb(var(--accent))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                </div>
                <button
                  onClick={e => { e.preventDefault(); setFile(null); }}
                  className="h-7 w-7 rounded-md flex items-center justify-center"
                  style={{ background: "rgb(var(--surface-2))" }}
                >
                  <X size={13} className="text-secondary" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-7 gap-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-1"
                  style={{ background: "rgb(var(--surface-2))" }}>
                  <Upload size={18} className="text-muted" />
                </div>
                <p className="text-sm font-medium text-secondary">Upload PDF document</p>
                <p className="text-xs text-muted">Contracts, audit reports, notices</p>
              </div>
            )}
          </div>
        </label>

        {/* ANALYZE BUTTON */}
        <button
          onClick={analyze}
          disabled={!canAnalyze}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: canAnalyze ? "rgb(var(--accent))" : "rgb(var(--surface-2))",
            color: canAnalyze ? "white" : "rgb(var(--text-3))",
            boxShadow: canAnalyze ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
          }}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>AI is reading your document…</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Extract Deadlines</span>
            </>
          )}
        </button>

        {loading && (
          <p style={{ textAlign: "center", fontSize: "12px", color: "rgb(var(--text-3))", fontFamily: "'DM Mono', monospace" }}>
            ⏳ Usually takes 20–40 seconds
          </p>
        )}

        {/* RESULTS */}
        {detected.length > 0 && (
          <div className="card animate-slide-up">
            <div
              className="flex items-center justify-between px-3.5 py-2.5"
              style={{ borderBottom: "1px solid rgb(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} style={{ color: "rgb(var(--success))" }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
                  {detected.length} Deadline{detected.length !== 1 ? "s" : ""} Found
                </span>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: "rgb(var(--border))" }}>
              {detected.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "rgb(var(--accent))" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{d.title}</p>
                    {d.due_date && (
                      <p className="text-xs font-mono text-muted mt-0.5">{d.due_date}</p>
                    )}
                  </div>
                  {d.confidence && (
                    <span className="text-[10px] font-mono text-muted flex-shrink-0">
                      {Math.round(d.confidence * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="px-3.5 py-3">
              <button
                onClick={save}
                className="w-full rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: "rgb(var(--accent))",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                }}
              >
                Save All Deadlines
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}