import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://cronus-api.ivixivi.workers.dev';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  tier?: 'creator' | 'studio';
  highlighted?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Creator',
    price: '$79',
    period: '/mo',
    description: 'For solo creators ready to scale content output.',
    features: [
      '1 brand',
      '5 assets/month',
      '5 platforms',
      'AI content generation',
      'Review queue',
      'Basic analytics',
    ],
    cta: 'Start Creating',
    tier: 'creator',
  },
  {
    name: 'Studio',
    price: '$249',
    period: '/mo',
    description: 'For agencies and studios managing multiple brands.',
    features: [
      '10 brands',
      '50 assets/month',
      'All platforms',
      'Priority AI generation',
      'Advanced analytics',
      'Team collaboration',
      'Custom brand voices',
      'API access',
    ],
    cta: 'Scale Your Studio',
    tier: 'studio',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with custom requirements.',
    features: [
      'Unlimited brands',
      'Unlimited assets',
      'All platforms',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'White-label options',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (tier: 'creator' | 'studio') => {
    setLoading(tier);
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout failed:', err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose Your Plan</h1>
        <p className="mt-3 text-lg text-gray-500">
          Transform premium assets into 30+ days of platform-optimized content.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`bg-white border rounded-xl p-8 flex flex-col ${
              t.highlighted
                ? 'border-gray-900 ring-2 ring-gray-900'
                : 'border-gray-200'
            }`}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t.name}</h2>
              <div className="mt-3 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {t.price}
                </span>
                {t.period && (
                  <span className="ml-1 text-lg text-gray-500">{t.period}</span>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-500">{t.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {t.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg
                    className="w-5 h-5 text-gray-900 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {t.tier ? (
              <button
                onClick={() => handleCheckout(t.tier!)}
                disabled={loading === t.tier}
                className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50 ${
                  t.highlighted
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {loading === t.tier ? 'Redirecting...' : t.cta}
              </button>
            ) : (
              <a
                href="mailto:hello@cronusmetabolus.com?subject=Enterprise%20Inquiry"
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-center bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 min-h-[44px] flex items-center justify-center"
              >
                {t.cta}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
