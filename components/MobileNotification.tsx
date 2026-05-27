'use client';

import { useState, useEffect, useRef } from 'react';

const NAMES = [
  'Priya S.', 'Rahul V.', 'Ananya K.', 'Vikram P.', 'Deepa M.',
  'Arun R.', 'Neha G.', 'Suresh B.', 'Lakshmi N.', 'Karthik J.',
  'Meena T.', 'Rajesh W.', 'Divya C.', 'Anil K.', 'Sunita D.',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

const DONATIONS = [
  { amount: 199, label: '₹199', item: 'Essential School Supplies' },
  { amount: 499, label: '₹499', item: 'School Books & Stationery' },
  { amount: 999, label: '₹999', item: 'School Bag & Uniform Set' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface NotificationData {
  name: string;
  city: string;
  label: string;
  item: string;
}

function generateNotification(): NotificationData {
  const donation = pick(DONATIONS);
  return {
    name: pick(NAMES),
    city: pick(CITIES),
    label: donation.label,
    item: donation.item,
  };
}

export default function MobileNotification() {
  const [data, setData] = useState<NotificationData | null>(null);
  const [show, setShow] = useState(false);
  const shownRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = () => {
    if (shownRef.current) return;
    shownRef.current = true;
    setData(generateNotification());
    setShow(true);
    hideTimerRef.current = setTimeout(() => {
      setShow(false);
      shownRef.current = false;
    }, 3000);
  };

  useEffect(() => {
    const first = setTimeout(showNext, 2000);
    const interval = setInterval(showNext, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!data) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[70] md:hidden"
      style={{
        bottom: show ? '80px' : '-120px',
        transition: 'bottom 0.4s ease-in-out',
      }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-outline-variant p-3.5 overflow-hidden relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-hope-amber/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-hope-amber text-lg">favorite</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-[12px] text-on-surface leading-tight">
              <span className="font-bold">{data.name}</span>
              {' '}from{' '}
              <span className="font-bold">{data.city}</span>
            </p>
            <p className="font-body-md text-[11px] text-on-surface-variant mt-0.5 leading-tight">
              donated{' '}
              <span className="font-bold text-hope-amber">{data.label}</span>
              {' '}for {data.item}
            </p>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-hope-amber/40"
          style={{
            width: show ? '100%' : '0%',
            transition: show ? 'width 3s linear' : 'none',
          }}
        />
      </div>
    </div>
  );
}
