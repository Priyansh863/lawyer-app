"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function EmailVerification() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    const verifyEmail = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://d3qiclz5mtkmyk.cloudfront.net/api/v1/user/verify-email?token=${token}`
        );
        const data = await res.json();
        setSuccess(data.success);
        setMessage(data.message || 'Verification complete.');
      } catch (err) {
        setSuccess(false);
        setMessage('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Email Verification</h1>
        {loading ? (
          <div className="text-blue-500 animate-pulse">Verifying...</div>
        ) : (
          <>
            <div className={`text-lg font-medium mb-4 ${success ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
            {success && (
              <a href="/login" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Go to Login</a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
