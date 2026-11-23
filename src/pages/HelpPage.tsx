import React, { useState } from 'react';
import { HelpCircle, RotateCcw, Truck, Mail, Send, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';

const FAQS = [
  {
    q: 'Do I need to sign up before I design or buy?',
    a: 'No! You can design your T-shirt, mug, hoodie, or cap and place an order right away as a guest.',
  },
  {
    q: 'How do WELCOME10 and the "Buy 2, Save 10%" bundle offer work together?',
    a: 'They stack! When you add 2 or more T-shirts or mugs to your cart, the 10% bundle savings applies automatically. On top of that, you can apply WELCOME10 for an extra 10% off orders of Rs 499 or more.',
  },
  {
    q: 'Are there any hidden taxes or surprise charges?',
    a: 'Never. Every price shown already includes 18% GST tax (9% CGST + 9% SGST). You can view, print, or download a full GST Tax Invoice right after checkout or on the Track Order page.',
  },
  {
    q: 'What photo quality do I need for sharp printing?',
    a: 'Clear, bright photos at 300 DPI look sharpest. Inside the Design Studio, a live print-quality badge automatically warns you if your uploaded photo is too small or stretched, and the green Safe Print Guide shows where to keep text and faces.',
  },
  {
    q: 'Can I order 5, 10, or 20+ matching shirts or mugs for my team or event?',
    a: 'Yes! Use the Team / Bulk Order Helper inside the Design Studio to pick 5, 10, or 20+ units or split sizes (S to XXL) in one tap. You automatically get 10% bundle savings on 2+ tees or mugs plus free delivery.',
  },
  {
    q: 'How long does printing and delivery take?',
    a: 'We print your custom item in 1–2 business days. Standard delivery takes 3–5 days (FREE on orders Rs 599+, Rs 79 below Rs 599), and Express Air delivery takes 1–2 days (Rs 149).',
  },
  {
    q: 'Will the print fade after washing?',
    a: 'No. We use breathable, wash-safe water-based ink for garments and dishwasher-safe glaze for ceramic mugs. Wash T-shirts and hoodies inside out in cold water for best results.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes! You can cancel for free anytime while your order is in "Order Received" or "Design Checked" status on the Track Order page. Once printing begins, custom items cannot be cancelled.',
  },
];

export const HelpPage: React.FC = () => {
  const t = useT();
  const showToast = useAppStore((s) => s.showToast);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !message.trim()) {
      showToast('Please enter a valid email and your question.', 'error');
      return;
    }
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    showToast('Message sent! Our team will reply within 1 day.', 'success');
  };

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Help, FAQ & Returns
      </h1>
      <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        Clear answers in plain words. Still stuck? Message us below.
      </p>

      {/* FAQ Section */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <HelpCircle className="h-6 w-6 text-[#7C3AED]" />
          Common Questions
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#16161D]"
            >
              <h3 className="font-display text-base font-bold">{item.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Return & Refund Policy — Clear Custom-Printed vs Standard Items Breakdown */}
      <section id="returns" className="mt-12 space-y-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <RotateCcw className="h-6 w-6 text-[#FF5A5F]" />
            Returns, Replacements & Refunds
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Because custom-printed gifts are made specially for you, our rules are simple and fair for both custom and blank items:
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Custom-Printed Items Policy */}
          <div className="rounded-3xl border border-[#7C3AED]/25 bg-white p-6 dark:border-[#7C3AED]/30 dark:bg-[#16161D]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA]">
              <Sparkles className="h-5 w-5" />
              <span>{t.enhancements.customPolicyTitle}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Every custom T-shirt, mug, hoodie, or cap is printed fresh to order with your artwork.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  <strong>Free Replacement or Full Refund (within 7 days):</strong> If your item arrives damaged, cracked, smudged, misprinted, or is the wrong size/item from what you ordered, we reprint and ship a fresh one free — or refund you in 3–5 business days.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  <strong>No change-of-mind returns once printed:</strong> Because we cannot resell an item with your personal photo or name, please check the <strong>Size &amp; Fit Guide</strong> and <strong>3D preview</strong> before placing your order.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />
                <span>
                  <strong>Fast claim:</strong> Open <strong>Track My Order</strong>, tap <em>Ask for Return or Refund</em>, and share what went wrong. Our team replies within 24 hours.
                </span>
              </li>
            </ul>
          </div>

          {/* Standard Blank Items Policy */}
          <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <RotateCcw className="h-5 w-5" />
              <span>{t.enhancements.standardPolicyTitle}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Bought a plain store T-shirt, hoodie, cap, or mug without custom printing?
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  <strong>7-Day Easy Return or Size Exchange:</strong> Return or swap sizes within 7 days of delivery for any reason, as long as the item is unworn, unwashed, and in original packaging.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  <strong>Quick Refunds:</strong> Prepaid refunds return to your original payment method in 3–5 business days. COD orders are refunded via UPI or bank transfer.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />
                <span>
                  <strong>Clear Pricing &amp; Delivery:</strong> Standard delivery is FREE on orders Rs 599+ (Rs 79 below). All prices include 18% GST with a printable &amp; downloadable GST invoice.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mt-12 rounded-3xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#16161D]">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Mail className="h-6 w-6 text-[#7C3AED]" />
          Contact Our Team
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Email us at <strong>support@designdrop.in</strong> or send a quick message here.
        </p>

        {sent ? (
          <div className="mt-6 rounded-2xl bg-emerald-500/15 p-5 text-sm font-semibold text-emerald-500">
            Thanks! We got your message and will email you back soon.
          </div>
        ) : (
          <form onSubmit={handleContact} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="help-name" className="block text-sm font-medium">
                Your Name
              </label>
              <input
                id="help-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
              />
            </div>
            <div>
              <label htmlFor="help-email" className="block text-sm font-medium">
                Your Email
              </label>
              <input
                id="help-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-base dark:border-white/15"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="help-msg" className="block text-sm font-medium">
                How can we help?
              </label>
              <textarea
                id="help-msg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/15 bg-transparent p-3 text-base dark:border-white/15"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white hover:bg-[#6D28D9]"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
