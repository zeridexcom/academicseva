'use client';

import { useState } from 'react';

interface DonationOptionsProps {
  onSelect: (amount: number) => void;
  selectedAmount: number;
}

const TIERS = [
  { amount: 199, label: '₹199', desc: 'Essential School Supplies' },
  { amount: 499, label: '₹499', desc: 'School Books & Stationery' },
  { amount: 999, label: '₹999', desc: 'School Bag & Uniform Set' },
];

export default function DonationOptions({ onSelect, selectedAmount }: DonationOptionsProps) {
  const [customValue, setCustomValue] = useState('');
  const [activeTier, setActiveTier] = useState<number>(199);

  const handleTierClick = (amount: number) => {
    setActiveTier(amount);
    setCustomValue('');
    onSelect(amount);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomValue(val);
    setActiveTier(0);
    const num = parseInt(val);
    if (num >= 199) {
      onSelect(num);
    }
  };

  const isCustomSelected = activeTier === 0 && customValue.length > 0;
  const customError = customValue.length > 0 && parseInt(customValue) < 199;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {TIERS.map((tier) => (
        <button
          key={tier.amount}
          type="button"
          onClick={() => handleTierClick(tier.amount)}
          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
            activeTier === tier.amount
              ? 'border-hope-amber bg-hope-amber/10 shadow-md ring-1 ring-hope-amber/30'
              : 'border-outline-variant bg-white/95 hover:border-hope-amber/50 hover:shadow-sm'
          }`}
        >
          <span
            className={`block font-headline-lg text-2xl font-bold ${
              activeTier === tier.amount ? 'text-hope-amber' : 'text-slate-deep'
            }`}
          >
            {tier.label}
          </span>
          <span className="block font-body-md text-[12px] text-on-surface-variant mt-1 leading-tight">
            {tier.desc}
          </span>
        </button>
      ))}
      <div
        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
          isCustomSelected
            ? 'border-hope-amber bg-hope-amber/10 shadow-md ring-1 ring-hope-amber/30'
            : 'border-outline-variant bg-white/95'
        }`}
      >
        <span className="block font-body-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
          Custom
        </span>
        <div className="flex items-center gap-0.5">
          <span className="font-headline-lg text-xl text-slate-deep font-bold">₹</span>
          <input
            type="text"
            inputMode="numeric"
            value={customValue}
            onChange={handleCustomChange}
            placeholder="199+"
            className="w-full min-w-0 font-headline-lg text-xl font-bold text-slate-deep outline-none bg-transparent placeholder:text-outline/60"
          />
        </div>
        {customError && (
          <span className="font-body-md text-[10px] text-error mt-0.5 block">
            Minimum ₹199
          </span>
        )}
      </div>
    </div>
  );
}
