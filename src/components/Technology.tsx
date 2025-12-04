import { Brain, BarChart3, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Brain,
    title: 'AI Dashboard Generator',
    description: 'Automatically generate interactive dashboards from any dataset with one click',
    gradient: 'from-blue-500 to-cyan-500',
    href: '/app',
  },
  {
    icon: BarChart3,
    title: 'Smart Data Analysis',
    description: 'Advanced ML algorithms uncover hidden patterns and correlations in your data',
    gradient: 'from-purple-500 to-pink-500',
    href: '/app',
  },
  {
    icon: Sparkles,
    title: 'Automated Reports',
    description: 'Generate comprehensive, branded reports automatically with AI-powered summaries',
    gradient: 'from-orange-500 to-red-500',
    href: '/analytics',
  },
  {
    icon: Zap,
    title: 'Insight Recommendations',
    description: 'Get actionable insights and predictions delivered directly to your dashboard',
    gradient: 'from-green-500 to-emerald-500',
    href: '/analytics',
  },
];

export default function Technology() {
  return (
    <section id="product" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful Technology
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Built with cutting-edge AI and machine learning to deliver real results
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.href}
                className="group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`} />
                </div>

                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6 shadow-lg`}>
                    <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    Learn more
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}