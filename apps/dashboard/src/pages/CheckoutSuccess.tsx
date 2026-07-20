import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SessionData {
  id: string;
  status: string;
  customerEmail: string | null;
  tier: string | null;
  subscriptionId: string | null;
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/v1/billing/session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch((err) => console.error('Failed to fetch session:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cronus</h1>

        {loading ? (
          <p className="text-gray-500">Confirming your subscription...</p>
        ) : session ? (
          <div>
            <p className="text-gray-600 mb-4">
              Your <span className="font-semibold capitalize">{session.tier}</span> subscription is active.
            </p>
            {session.customerEmail && (
              <p className="text-sm text-gray-500 mb-6">
                Confirmation sent to {session.customerEmail}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Your subscription has been confirmed.</p>
        )}

        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
