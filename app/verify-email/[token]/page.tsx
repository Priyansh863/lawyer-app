
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EmailVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token[0] : undefined;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing verification token.");
      setLoading(false);
      return;
    }
    const verifyEmail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://d3qiclz5mtkmyk.cloudfront.net/api/v1/user/verify-email?token=${token}`
        );
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.json();
        setSuccess(data.success);
        setMessage(data.message || "Verification complete.");
        if (!data.success) {
          setError(data.message || "Verification failed.");
        }
      } catch (err: any) {
        setSuccess(false);
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-md w-full text-center border border-blue-100">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {loading ? (
              <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="4" className="animate-spin" />
            ) : success ? (
              <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ) : (
              <path d="M6 18L18 6M6 6l12 12" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
          </svg>
          <h1 className="text-2xl font-bold mb-2 text-blue-700">Email Verification</h1>
        </div>
        {loading ? (
          <div className="text-blue-500 animate-pulse text-lg">Verifying your email...</div>
        ) : error ? (
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
        ) : (
          <div className="text-green-600 text-lg font-medium mb-4">{message}</div>
        )}
        {!loading && success && (
          <a href="/login" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold">Go to Login</a>
        )}
        {!loading && !success && (
          <button
            className="mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}
