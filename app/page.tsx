'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import DonationOptions from '@/components/DonationOptions';
import MobileNotification from '@/components/MobileNotification';
import DesktopNotification from '@/components/DesktopNotification';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  theme?: { color?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [taxExempt, setTaxExempt] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'receipt' | 'processing-payment' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(199);
  const amountPaise = selectedAmount * 100;
  const amountRupee = `₹${selectedAmount}`;

  const handleDonateClick = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          email: '',
          name: '',
          pan: '',
          taxExempt: false,
        }),
      });

      const errorData = !orderResponse.ok ? await orderResponse.json().catch(() => null) : null;
      if (!orderResponse.ok) throw new Error(errorData?.error || 'Failed to create order');
      const { orderId } = await orderResponse.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amountPaise,
        currency: 'INR',
        name: 'Academic Seva',
        description: 'Urgent Student Needs — Donation',
        order_id: orderId,
        handler: (response: RazorpayResponse) => {
          setPaymentId(response.razorpay_payment_id);
          setStatus('receipt');
        },
        theme: { color: '#D97706' },
      });

      rzp.on('payment.failed', () => {
        setErrorMessage('Payment was cancelled or failed. Please try again.');
        setStatus('error');
      });

      rzp.open();
      setStatus('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing-payment');

    try {
      await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          email: email.trim() || '',
          taxExempt,
          name: name.trim() || '',
          pan: pan.trim() || '',
          amount: amountPaise / 100,
        }),
      });
    } catch {
      // email sending may fail but payment is done
    }

    setStatus('success');
  };

  const skipReceipt = () => {
    setStatus('success');
  };

  // SUCCESS SCREEN
  if (status === 'success') {
    return <SuccessScreen name={name} email={email} amount={amountRupee} paymentId={paymentId} />;
  }

  // RECEIPT FORM (after successful payment)
  if (status === 'receipt' || status === 'processing-payment') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-warm px-gutter">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl border border-outline-variant">
          <span className="material-symbols-outlined text-hope-amber text-4xl mb-4 block">check_circle</span>
          <h2 className="font-headline-lg text-headline-lg text-slate-deep mb-2">Payment Successful!</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            Want a receipt? Enter your details below.
          </p>
          <form onSubmit={handleReceiptSubmit}>
            <input
              type="text"
              placeholder="Your full name (required for 80G)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg border border-outline-variant focus:border-hope-amber focus:ring-2 focus:ring-hope-amber/20 outline-none text-on-surface placeholder:text-outline font-body-md mb-4"
              autoFocus
            />
            <input
              type="email"
              placeholder="Email for receipt (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg border border-outline-variant focus:border-hope-amber focus:ring-2 focus:ring-hope-amber/20 outline-none text-on-surface placeholder:text-outline font-body-md mb-4"
            />
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
                className="w-4 h-4 accent-hope-amber"
              />
              <span className="font-body-md text-body-md text-on-surface-variant">
                I need tax exemption receipt (80G)
              </span>
            </label>
            {taxExempt && (
              <input
                type="text"
                placeholder="PAN (required for 80G certificate)"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full px-4 py-3.5 rounded-lg border border-outline-variant focus:border-hope-amber focus:ring-2 focus:ring-hope-amber/20 outline-none text-on-surface placeholder:text-outline font-body-md mb-4"
              />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={skipReceipt}
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={status === 'processing-payment'}
                className="flex-1 py-3 px-4 bg-hope-amber text-white font-label-caps text-label-caps uppercase tracking-wider rounded-lg hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {status === 'processing-payment' ? 'Sending...' : 'Get Receipt'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ERROR SCREEN
  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-warm px-gutter">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl border border-outline-variant text-center">
          <span className="material-symbols-outlined text-red-500 text-4xl mb-4 block">error</span>
          <h2 className="font-headline-lg text-headline-lg text-slate-deep mb-2">Something Went Wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">{errorMessage}</p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full py-3 px-4 bg-hope-amber text-white font-label-caps text-label-caps uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // MAIN PAGE
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="bg-white sticky top-0 z-50 border-b border-outline-variant flex justify-between items-center w-full px-gutter h-16 shadow-sm">
        <div className="flex items-center">
          <img alt="Academic Seva" className="h-6 md:h-8 object-contain" src="/images/logo.png" />
        </div>
        <div className="flex gap-4">
          <a className="font-label-caps text-[10px] text-primary font-bold hover:text-hope-amber transition-colors self-center" href="#needs">Urgent Needs</a>
          <a className="bg-hope-amber text-white font-label-caps text-[10px] py-2 px-4 uppercase tracking-wider" href="#needs">Provide Help</a>
        </div>
      </header>

      <main className="pb-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img alt="Students in urgent need" className="w-full h-full object-cover grayscale-[30%] brightness-75" src="/images/hero.jpg" />
            <div className="absolute inset-0 hero-gradient"></div>
          </div>
          <div className="relative z-10 w-full max-w-container-max px-gutter pb-12 md:pb-stack-lg text-white text-center">
            <h1 className="font-headline-lg-mobile md:font-headline-xl text-headline-lg-mobile md:text-headline-xl mb-4 leading-tight">Urgent Student Needs.</h1>
            <p className="font-body-md text-body-md mb-8 text-primary-fixed opacity-90 max-w-lg mx-auto uppercase tracking-widest font-bold">A childhood is being lost right now. Choose your impact below.</p>
            <div className="max-w-2xl mx-auto">
              <DonationOptions onSelect={setSelectedAmount} selectedAmount={selectedAmount} />
              <button
                onClick={handleDonateClick}
                disabled={status !== 'idle'}
                className="mt-8 w-full bg-hope-amber text-white font-label-caps text-label-caps py-4 px-10 tracking-[0.2em] uppercase transition-all duration-500 hover:shadow-xl active:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Provide Help &mdash; {amountRupee}
              </button>
            </div>
          </div>
        </section>

        {/* Needs Listing Section */}
        <section className="py-12 px-gutter bg-surface-warm" id="needs">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg text-headline-lg text-slate-deep mb-4">Urgent Needs Directory</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Select a specific area to direct your support. Choose from ₹199, ₹499, ₹999 or a custom amount — every contribution makes a life-changing difference.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Need Item: Tuition & Books */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant flex flex-col">
                <img alt="Student Tuition &amp; Books" className="w-full h-56 object-cover grayscale-[20%]" src="/images/tuition.jpg" />
                <div className="p-6 flex-grow flex flex-col">
                  <span className="text-error-subdued font-label-caps text-label-caps mb-2 block uppercase tracking-widest font-bold">Urgent Need: Education</span>
                  <h3 className="font-headline-lg text-2xl text-slate-deep mb-3">Student Tuition &amp; Books</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-0 flex-grow">For thousands of children, a pencil isn&apos;t a choice; it&apos;s daily survival. When you can&apos;t afford books, dreaming of the future is impossible. Your ₹199 provides essential learning materials.</p>
                </div>
              </div>
              {/* Need Item: Family Nutrition */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant flex flex-col">
                <img alt="Family Nutrition Kit" className="w-full h-56 object-cover grayscale-[10%]" src="/images/nutrition.jpg" />
                <div className="p-6 flex-grow flex flex-col">
                  <span className="text-error-subdued font-label-caps text-label-caps mb-2 block uppercase tracking-widest font-bold">Urgent Need: Survival</span>
                  <h3 className="font-headline-lg text-2xl text-slate-deep mb-3">Family Nutrition Kit</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-0 flex-grow">Hunger doesn&apos;t wait. Provide a vulnerable family with the basic nutrition they need to survive, ensuring children have the energy to learn and grow. Just ₹199 makes a profound difference.</p>
                </div>
              </div>
              {/* Need Item: Digital Learning */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant flex flex-col">
                <img alt="Digital Learning Access" className="w-full h-56 object-cover grayscale-[20%]" src="/images/digital.jpg" />
                <div className="p-6 flex-grow flex flex-col">
                  <span className="text-error-subdued font-label-caps text-label-caps mb-2 block uppercase tracking-widest font-bold">Urgent Need: Access</span>
                  <h3 className="font-headline-lg text-2xl text-slate-deep mb-3">Digital Learning Access</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-0 flex-grow">Bridge the widening digital divide. Give a student the crucial tools to connect to modern education and build a brighter future. ₹199 unlocks digital access for those left behind.</p>
                </div>
              </div>
              {/* Need Item: Health & Hygiene */}
              <div className="bg-surface p-6 rounded-xl overflow-hidden shadow-sm border border-outline-variant flex flex-col justify-center text-center">
                <span className="material-symbols-outlined text-hope-amber text-5xl mb-4">medical_services</span>
                <span className="text-error-subdued font-label-caps text-label-caps mb-2 block uppercase tracking-widest font-bold">Urgent Need: Wellbeing</span>
                <h3 className="font-headline-lg text-2xl text-slate-deep mb-3">Health &amp; Hygiene Support</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-0 flex-grow">Basic hygiene and medical care are often out of reach. Protect a child&apos;s health and dignity with a vital hygiene kit. Every ₹199 ensures a safer, healthier tomorrow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Streamlined Impact & CTA */}
        <section className="py-12 px-gutter bg-white border-y border-outline-variant" id="donate">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-headline-lg text-headline-lg text-slate-deep mb-4">Will you let them wait?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-lg mx-auto">
              ₹199 is all it takes to start. But ₹499 buys school books, and ₹999 provides a full bag & uniform set. Choose your impact.
            </p>
            <div className="mb-8 text-left">
              <DonationOptions onSelect={setSelectedAmount} selectedAmount={selectedAmount} />
            </div>
            <div className="bg-surface p-8 border border-outline-variant">
              <button
                onClick={handleDonateClick}
                disabled={status !== 'idle'}
                className="w-full bg-hope-amber text-white font-label-caps text-label-caps py-5 px-gutter tracking-widest uppercase transition-all duration-300 hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Donate {amountRupee} Now
              </button>
              <p className="mt-4 font-label-caps text-[10px] text-outline uppercase tracking-tighter">Secure Payment via Razorpay</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-12 px-gutter text-center space-y-6">
        <img alt="Academic Seva" className="h-6 invert opacity-60 mx-auto" src="/images/logo.png" />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a className="font-label-caps text-[10px] text-on-tertiary-container hover:text-white transition-colors" href="#">Impact</a>
          <a className="font-label-caps text-[10px] text-on-tertiary-container hover:text-white transition-colors" href="#">Transparency</a>
          <a className="font-label-caps text-[10px] text-on-tertiary-container hover:text-white transition-colors" href="#">Contact</a>
        </nav>
        <p className="font-body-md text-[13px] text-on-primary-container max-w-md mx-auto">
          © {new Date().getFullYear()} Academic Seva. Registered NGO.
        </p>
      </footer>

      <MobileNotification />
      <DesktopNotification />

      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-outline-variant p-4 md:hidden flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-deep">Support a student with {amountRupee}.</span>
        </div>
        <a className="bg-hope-amber text-white font-label-caps text-[12px] py-3 px-6 uppercase tracking-wider font-bold" href="#donate">Donate</a>
      </div>
    </>
  );
}

function SuccessScreen({ name, email, amount, paymentId }: { name: string; email: string; amount: string; paymentId: string }) {
  const REDIRECT_URL = 'https://academicseva.org';
  const REDIRECT_SECONDS = 12;

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (mountedRef.current) window.location.href = REDIRECT_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const redirectNow = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    window.location.href = REDIRECT_URL;
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-warm px-gutter">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-hope-amber text-6xl mb-6">favorite</span>
        <h1 className="font-headline-lg text-headline-lg text-slate-deep mb-4 leading-tight">
          Thank You{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}!
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          Your contribution of {amount} will directly help a student in need.
          {email.trim() && <> A receipt has been sent to <strong>{email}</strong>.</>}
        </p>
        <p className="font-body-md text-body-md text-outline mb-8">
          Payment ID: {paymentId}
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={redirectNow}
            className="bg-hope-amber text-white font-label-caps text-label-caps py-3 px-8 rounded-lg hover:brightness-110 transition-all cursor-pointer"
          >
            Go to Academic Seva
          </button>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Auto-redirecting in {countdown}s...
          </p>
        </div>
      </div>
    </main>
  );
}
