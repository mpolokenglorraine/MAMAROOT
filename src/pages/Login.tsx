import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useT } from '../i18n/useT';

export default function Login() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim();

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        if (loginError.message === 'Invalid login credentials' || loginError.message?.toLowerCase().includes('invalid login credentials')) {
          setError('That email and password do not match. If you have not created an account yet, tap Create my profile.');
        } else {
          setError(loginError.message || 'Failed to sign in. Please verify your email and password.');
        }
        return;
      }

      if (authData?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userProfile && userProfile.onboarding_complete === true) {
          navigate('/mother-dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (err: any) {
      if (err?.message === 'Invalid login credentials' || err?.message?.toLowerCase().includes('invalid login credentials')) {
        setError('That email and password do not match. If you have not created an account yet, tap Create my profile.');
      } else {
        setError(err?.message || 'Failed to sign in. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans flex flex-col justify-between py-8 px-4 fade-up">
      {/* Centred single column */}
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

        {/* Welcome Headline Card: Leaf tint #E8EAD0 with Leaf border #C5C98F */}
        <div className="bg-[#E8EAD0] border border-[#C5C98F] rounded-3xl p-5 space-y-1.5 shadow-xs">
          <h2 className="text-sm font-bold font-heading text-[#3B1409] leading-snug">
            {t('welcome_tagline')}
          </h2>
          <p className="text-xs text-[#3F4318] leading-relaxed">
            {t('welcome_subtext')}
          </p>
        </div>

        {/* Sign In Form */}
        <div className="app-card space-y-4">
          <div className="border-b border-[#EAD5C0] pb-2.5">
            <h3 className="text-base font-bold font-heading text-[#3B1409]">{t('sign_in_header')}</h3>
            <p className="text-xs text-[#6B4A3A] mt-0.5">
              {t('sign_in_subheader')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
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

            <div>
              <label className="block text-xs font-semibold text-[#3B1409] mb-1">
                {t('password_label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B4A3A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B4A3A] hover:text-[#3B1409] focus-ring rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              {loading ? t('signing_in') : t('sign_in_btn')}
            </button>
          </form>

          {/* Secondary Button to Create Profile */}
          <div className="pt-1">
            <Link
              to="/signup"
              className="btn-secondary"
            >
              {t('create_my_profile')}
            </Link>
          </div>
        </div>

        {/* Footer note */}
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
