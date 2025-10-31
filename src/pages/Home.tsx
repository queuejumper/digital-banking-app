import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Modern Accounts & KYC Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage multi-currency accounts, submit KYC, and track transactions in one streamlined place.</p>
        {user ? (
          <div className="mt-5 flex gap-3">
            <Link to="/accounts" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go to Accounts</Link>
            <Link to="/kyc" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">KYC</Link>
            {(user.role === "ADMIN" || user.role === "STAFF") && (
              <Link to="/admin" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">Admin</Link>
            )}
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <Link to="/login" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">Login</Link>
            <Link to="/signup" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Sign up</Link>
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <div className="rounded-xl border bg-white shadow-sm p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 h-20" />
            <div className="rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 h-20" />
            <div className="rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 h-20" />
            <div className="rounded-lg bg-gradient-to-r from-blue-200 to-blue-300 h-20" />
          </div>
        </div>
      </div>
    </div>
  );
}


