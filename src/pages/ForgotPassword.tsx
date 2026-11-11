import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { useT } from '../i18n/useT';

export default function ForgotPassword() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans flex flex-col justify-between py-8 px-4 fade-up">
      <div className="w-full max-w-md mx-auto space-y-5">
        
        {/* Centred Logo (150px wide) above the wordmark 'Mama Root' */}
        <div className="text-center space-y-1.5 pt-2">
          <img
            src="/logo.png"
            alt="Mama Root logo: a mother holding her child, with roots below"
            className="w-[150px] object-contain mx-auto mb-2"
          />
          <h1 className="text-3xl font-extrabold text-[#3B1409] tracking-tight font-heading">
            Mama Root
          </h1>
          <p className="text-xs italic text-[#6B4A3A]">
            {t('welcome_motto')}
          </p>
        </div>

        {/* Card */}
        <div className="app-card space-y-4">
          <div className="border-b border-[#EAD5C0] pb-2.5">
            <h2 className="text-base font-bold font-heading text-[#3B1409]">Reset Password</h2>
            <p className="text-xs text-[#6B4A3A] mt-0.5">
              Enter your email and we will send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#E8EAD0] border border-[#C5C98F] rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-[#5E5A28]">
                <CheckCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <p className="text-xs font-semibold text-[#3F4318]">
                Reset instructions sent to {email}. Please check your inbox.
              </p>
              <Link to="/login" className="btn-primary mt-2 inline-flex">
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3B1409] mb-1">
                  {t('email_label')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B4A3A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#F8DFC8] text-[#7A2E10] text-xs rounded-xl border border-[#E0A77A]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Sending link...' : 'Send reset link'}
              </button>

              <div className="pt-1 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A9421B] hover:text-[#833518]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign in</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-[#6B4A3A] leading-relaxed flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5E5A28] shrink-0" />
            <span>{t('privacy_footer')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
