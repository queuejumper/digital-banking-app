import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";

function formatError(err: any): string {
  const error = err?.response?.data?.error;
  if (!error) return "Signup failed";
  
  // Handle validation errors array
  if (Array.isArray(error.message)) {
    const messages = error.message.map((m: any) => {
      if (typeof m === 'string') return m;
      if (m.message) {
        const field = m.path?.[0] || 'field';
        return `${field}: ${m.message}`;
      }
      return JSON.stringify(m);
    });
    return messages.join(', ');
  }
  
  return error.message || "Signup failed";
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/");
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-14">
      {error && <div className="mb-3"><Alert title="Signup failed" onClose={() => setError(null)}>{error}</Alert></div>}
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            required 
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          {password.length > 0 && password.length < 8 && (
            <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters</p>
          )}
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 text-white py-2 hover:bg-blue-700 disabled:opacity-70">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-600">
        Have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </div>
  );
}


