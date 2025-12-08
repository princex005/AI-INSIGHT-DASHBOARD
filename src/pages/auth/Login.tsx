import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("https://insigtiqo-backend.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    // Save token correctly
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    navigate("/app"); // redirect to dashboard
  };

  return (
    <div className="pt-32 pb-32 max-w-md mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 rounded bg-slate-800"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          className="w-full p-3 rounded bg-slate-800"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" className="w-full p-3 rounded bg-blue-600">
          Login
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-400">
        No account?
        <button onClick={() => navigate("/signup")} className="text-blue-400">
          {" "}
          Sign up
        </button>
      </p>
    </div>
  );
}
