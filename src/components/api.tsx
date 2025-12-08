// src/api/insightApi.js

const API_BASE = "https://insigtiqo-backend.onrender.com";

export async function askInsight(question, dataset, chartData) {
  try {
    const res = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, dataset, chartData }),
    });

    return await res.json();
  } catch (err) {
    console.error("❌ askInsight Error:", err);
    return { error: err.message };
  }
}

export async function forecastValues(values) {
  try {
    const res = await fetch(`${API_BASE}/api/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });

    return await res.json();
  } catch (err) {
    console.error("❌ forecast Error:", err);
    return { error: err.message };
  }
}

export async function generateBusinessInsights(dataset) {
  try {
    const res = await fetch(`${API_BASE}/api/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset }),
    });

    return await res.json();
  } catch (err) {
    console.error("❌ insights Error:", err);
    return { error: err.message };
  }
}
