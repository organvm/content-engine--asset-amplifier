import React from 'react';
import { Link } from 'react-router-dom';

export default function CheckoutCancel() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Cancelled</h1>
        <p className="text-gray-600 mb-6">
          No worries — you can upgrade anytime when you are ready.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors min-h-[44px]"
          >
            View Plans
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
