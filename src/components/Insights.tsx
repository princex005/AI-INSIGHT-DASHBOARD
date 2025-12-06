import { useState } from "react";
import { ArrowLeft, Brain, LineChart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function Insights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [forecast, setForecast] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // 1️⃣ Generate Insights API
  // -----------------------------
  const fetchInsights = async () => {
    setLoading(true);
    setInsights(["Loading..."]);

    try {
      const res = await fetch("http://localhost:5000/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: {
            summary: "User analytics dataset for generating insights.",
            metrics: [
              { metric: "Revenue", values: [120, 200, 260, 300] },
              { metric: "Users", values: [50, 80, 100, 120] }
            ]
          }
        })
      });

      const data = await res.json();

      if (!data.insights) {
        setInsights(["No insights available."]);
      } else {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error("Insight Error:", err);
      setInsights(["Error fetching insights"]);
    }

    setLoading(false);
  };

  // -----------------------------
  // 2️⃣ Ask AI API
  // -----------------------------
  const askAI = async () => {
    if (!question.trim()) return alert("Enter a question first!");

    setAnswer("Thinking...");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          dataset: { summary: "Analytics overview" },
          chartData: [{ region: "North", revenue: 120000 }]
        })
      });

      const data = await res.json();

      setAnswer(
        data?.choices?.[0]?.message?.content ||
        "AI could not answer. Try rephrasing your question."
      );
    } catch (err) {
      console.error("Ask AI Error:", err);
      setAnswer("Error fetching AI response.");
    }

    setLoading(false);
  };

  // -----------------------------
  // 3️⃣ Forecast API
  // -----------------------------
  const runForecast = async () => {
    setForecast("Loading...");
    setLoading(true);

    const pastValues = [100, 180, 260, 320];

    try {
      const res = await fetch("http://localhost:5000/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: pastValues })
      });

      const data = await res.json();

      setForecast(
        data.forecast?.replace(/\n/g, " ") || "No forecast available."
      );
    } catch (err) {
      console.error("Forecast Error:", err);
      setForecast("Error generating forecast.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4">

        {/* BACK BUTTON */}
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">AI Insights Center</h1>

        {/* -----------------------------
            1️⃣ GENERATE INSIGHTS
        ------------------------------ */}
        <div className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10 shadow-xl">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-cyan-400" />
            Generate AI Insights
          </h2>

          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm"
          >
            Generate Insights
          </button>

          <ul className="mt-4 text-sm text-slate-300 space-y-2">
            {insights.map((i, index) => (
              <li key={index}>• {i}</li>
            ))}
          </ul>
        </div>

        {/* -----------------------------
            2️⃣ ASK AI QUESTION
        ------------------------------ */}
        <div className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10 shadow-xl">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-green-400" />
            Ask AI a Question
          </h2>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-900 text-sm border border-white/10 mb-3"
            placeholder="Example: Which region performed best last month?"
            rows={3}
          />

          <button
            onClick={askAI}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
          >
            Ask AI
          </button>

          {answer && (
            <p className="mt-4 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
              {answer}
            </p>
          )}
        </div>

        {/* -----------------------------
            3️⃣ FORECAST
        ------------------------------ */}
        <div className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10 shadow-xl">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-yellow-400" />
            Forecast Future Values
          </h2>

          <button
            onClick={runForecast}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm"
          >
            Generate Forecast
          </button>

          {forecast && (
            <p className="mt-4 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
              {forecast}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
