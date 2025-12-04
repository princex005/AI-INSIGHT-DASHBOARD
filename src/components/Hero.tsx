import { useState, FormEvent } from 'react';
import { ArrowRight, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/supabaseClient';

export default function Hero() {
  const navigate = useNavigate();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartTrialClick = () => {
    setShowTrialModal(true);
    setErrorMessage(null);

    trackEvent({
      eventType: 'trial_modal_open',
      page: '/',
    }).catch(() => {
      // ignore analytics failures
    });
  };

  const handleWatchDemoClick = () => {
    setShowDemoModal(true);

    trackEvent({
      eventType: 'demo_modal_open',
      page: '/',
      metadata: { source: 'hero' },
    }).catch(() => {
      // ignore analytics failures
    });
  };

  const handleTrialSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const cleanEmail = email.trim();
      window.localStorage.setItem('insightai_trial_email', cleanEmail);

      trackEvent({
        eventType: 'trial_started',
        page: '/',
        email: cleanEmail,
        metadata: { source: 'hero' },
      }).catch(() => {
        // ignore analytics failures
      });

      setShowTrialModal(false);
      navigate('/app');
    } catch (err) {
      console.error('Error starting free trial:', err);
      setErrorMessage('Something went wrong while starting your trial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-sm text-slate-300">AI-Powered Analytics Platform</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                AI-Powered Insights
              </span>
              <br />
              <span className="text-slate-400">for Your Business</span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
              Upload your dataset and get automatic dashboards, insights, and predictions powered by advanced AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleStartTrialClick}
              className="relative group px-8 py-4 font-semibold overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleWatchDemoClick}
              className="relative group px-8 py-4 font-semibold rounded-lg border border-white/20 text-white hover:bg-white/5 backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              Cancel anytime
            </div>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-3xl opacity-50" />

          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">Dashboard Preview</h3>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 mb-3">Revenue Trend</p>
                  <div className="flex items-end gap-1 h-16">
                    {[30, 50, 35, 70, 45, 80, 60, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-xs text-slate-400 mb-2">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-400">94.2%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-xs text-slate-400 mb-2">Predictions</p>
                    <p className="text-2xl font-bold text-cyan-400">2.3B</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 mb-3">Key Insights</p>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      Revenue up 24% YoY
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                      Customer growth: 15% MoM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-slate-950 border border-white/10 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowTrialModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-semibold mb-2 text-white">Start your free trial</h2>
            <p className="text-sm text-slate-400 mb-4">
              Enter your email and we&apos;ll send you a secure magic link to access your InsightAI trial.
            </p>

            <form onSubmit={handleTrialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="trial-email">
                  Work email
                </label>
                <input
                  id="trial-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-red-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Starting your trial…' : 'Start free trial'}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500">
              By continuing you agree to receive trial-related emails from InsightAI. You can unsubscribe at any time.
            </p>
          </div>
        </div>
      )}

      {showDemoModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4 rounded-2xl bg-slate-950 border border-white/10 p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-semibold text-white">Product Demo</h2>
              <p className="text-sm text-slate-400">
                Watch this short walkthrough to see how InsightAI turns your raw data into interactive dashboards,
                AI-generated insights, and forecasts.
              </p>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <iframe
                  src="https://drive.google.com/file/d/1WF9l1uuaXBA3qkgtT1FIh22S1zaKAzwr/preview"
                  title="InsightAI product demo"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <p className="text-xs text-slate-500">
                Replace the demo video URL in <code className="font-mono text-[10px]">Hero.tsx</code> with your own hosted video
                (e.g., YouTube, Loom, or another platform) when you have it ready.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
