import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, Sparkles, BarChart3, FileText, ArrowLeft, AlertTriangle, Download, 
  Filter, ArrowUpDown, ChevronDown, TrendingUp, DollarSign, Users, Clock, 
  Zap, Activity, Award, File, BarChart2, PieChart, LineChart as LineChartIcon,
  Play, Pause, Maximize2, RefreshCw
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Cell,
  ReferenceLine
} from 'recharts';

interface ChartPoint {
  category: string;
  value: number;
}

interface TopCategory extends ChartPoint {
  share: number;
  rank: number;
}

interface AnalysisResult {
  rowCount: number;
  columnCount: number;
  metricColumn: string;
  dimensionColumn: string;
  chartData: ChartPoint[];
  totalMetric: number;
  topCategories: TopCategory[];
  summary: string;
  insights: string[];
  trends: string[];
  recommendations: string[];
  benchmark: {
    avg: number;
    median: number;
    top25pct: number;
  };
}

const SAMPLE_CSV = `Region,Month,Revenue,Customers,Profit,Orders
North,Jan,120000,320,24000,150
North,Feb,135000,340,27000,165
North,Mar,142000,355,28400,172
South,Jan,95000,280,19000,120
South,Feb,99000,295,19800,128
South,Mar,105000,310,21000,135
West,Jan,78000,220,15600,98
West,Feb,82000,230,16400,102
West,Mar,91000,245,18200,110
East,Jan,110000,300,22000,140
East,Feb,125000,325,25000,155
East,Mar,132000,340,26400,162`;

function detectDelimiter(headerLine: string): string {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;

  for (const delim of candidates) {
    const count = (headerLine.match(new RegExp(`\\${delim}`, 'g')) || []).length + 1;
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }
  return best;
}

function normalizeText(text: string): string {
  return text.replace(/^\uFEFF/, '').trim();
}

function parseCsv(rawText: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanText = normalizeText(rawText);
  const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must have header and at least one data row.');
  }

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);
  const headers = headerLine.split(delimiter).map(h => h.trim()).filter(h => h);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const parts = line.split(delimiter);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      let value = (parts[index] ?? '').trim();
      // Basic quote handling
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      row[header] = value;
    });
    rows.push(row);
  }

  return { headers, rows };
}

function isNumeric(value: string): boolean {
  if (!value || value === '') return false;
  const cleaned = value.replace(/[,$%]/g, '');
  const n = Number(cleaned);
  return !isNaN(n) && isFinite(n);
}

function generateInsights(result: AnalysisResult): { insights: string[]; trends: string[]; recommendations: string[] } {
  const { chartData, metricColumn, dimensionColumn, topCategories, benchmark } = result;
  const topPerformer = topCategories[0];
  const insights: string[] = [];
  const trends: string[] = [];
  const recommendations: string[] = [];

  if (topPerformer) {
    insights.push(`🏆 ${topPerformer.category} dominates with ${((topPerformer.share)).toFixed(1)}% market share (${topPerformer.value.toLocaleString()})`);
    
    const underperformers = topCategories.slice(-2);
    if (underperformers.length > 0) {
      const last = underperformers[underperformers.length - 1];
      insights.push(`📉 ${last.category} contributes only ${last.share.toFixed(1)}% (${last.value.toLocaleString()})`);
    }
  }

  const avg = benchmark.avg;
  const categoriesAboveAvg = chartData.filter(d => d.value > avg).length;
  insights.push(`${categoriesAboveAvg} out of ${chartData.length} categories (${((categoriesAboveAvg/chartData.length)*100).toFixed(0)}%) exceed average performance`);

  if (topCategories.length >= 3) {
    const growth = ((topCategories[0].value - topCategories[2].value) / topCategories[2].value * 100);
    if (growth > 10) {
      trends.push(`📈 Top performer is ${growth.toFixed(1)}% stronger than 3rd place`);
    }
  }

  const concentration = topCategories[0].share;
  if (concentration > 50) {
    recommendations.push('⚠️ High concentration risk - top category dominates >50% of total');
  } else if (concentration > 30) {
    recommendations.push('✅ Healthy distribution - no single category dominates');
  }

  if (chartData.length > 5) {
    const longTailShare = chartData.slice(5).reduce((sum, d) => sum + d.value, 0) / result.totalMetric * 100;
    if (longTailShare > 20) {
      recommendations.push(`📊 Long tail opportunity: bottom categories contribute ${longTailShare.toFixed(1)}%`);
    }
  }

  return { insights, trends, recommendations };
}

function analyzeData(headers: string[], rows: Record<string, string>[], prompt: string): AnalysisResult {
  if (rows.length === 0) {
    throw new Error('No valid data rows found.');
  }

  // Enhanced numeric detection
  const numericHeaders = headers.filter((h) => {
    const sampleValues = rows.slice(0, Math.min(100, rows.length)).map((r) => r[h]);
    const numericCount = sampleValues.filter(isNumeric).length;
    const ratio = numericCount / Math.max(sampleValues.length, 1);
    return ratio >= 0.7; // More strict threshold
  }).sort((a, b) => {
    // Prioritize columns with higher sums (more important metrics)
    const sumA = rows.reduce((acc, row) => acc + (isNumeric(row[a]) ? Number(row[a].replace(/[,$%]/g, '')) : 0), 0);
    const sumB = rows.reduce((acc, row) => acc + (isNumeric(row[b]) ? Number(row[b].replace(/[,$%]/g, '')) : 0), 0);
    return sumB - sumA;
  });

  const categoricalHeaders = headers.filter(h => !numericHeaders.includes(h));

  if (numericHeaders.length === 0) {
    throw new Error('No numeric columns detected. Ensure your CSV has revenue, sales, or numeric metrics.');
  }

  const lowerPrompt = prompt.toLowerCase();
  
  const chooseColumn = (candidates: string[], fallback: string, keywords: string[] = []): string => {
    if (candidates.length === 0) return fallback;

    // Exact match first
    for (const col of candidates) {
      if (lowerPrompt.includes(col.toLowerCase())) return col;
    }
    
    // Keyword match
    for (const col of candidates) {
      const tokens = col.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      if (tokens.some(t => keywords.includes(t) || lowerPrompt.includes(t))) return col;
    }
    
    return candidates[0];
  };

  const metricKeywords = ['revenue', 'sales', 'profit', 'amount', 'value', 'count', 'orders', 'price'];
  const dimensionKeywords = ['region', 'category', 'product', 'customer', 'month', 'date'];

  const metricColumn = chooseColumn(numericHeaders, numericHeaders[0], metricKeywords);
  const dimensionColumn = chooseColumn(
    categoricalHeaders.length > 0 ? categoricalHeaders : headers.slice(0, 3),
    categoricalHeaders[0] || headers[0],
    dimensionKeywords
  );

  // Aggregate data
  const grouped = new Map<string, number>();
  for (const row of rows) {
    const dimKey = (row[dimensionColumn] || 'Unknown').toString().trim();
    const rawMetric = row[metricColumn];
    const value = isNumeric(rawMetric) ? Number(rawMetric.replace(/[,$%]/g, '')) : 0;
    if (value > 0) {
      grouped.set(dimKey, (grouped.get(dimKey) ?? 0) + value);
    }
  }

  const chartData: ChartPoint[] = Array.from(grouped.entries())
    .map(([category, value]) => ({ category, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalMetric = chartData.reduce((sum, p) => sum + p.value, 0);
  
  if (totalMetric === 0) {
    throw new Error(`No valid numeric data in ${metricColumn}. Try a different metric in your prompt.`);
  }

  // Benchmarks
  const values = chartData.map(d => d.value).sort((a, b) => a - b);
  const avg = totalMetric / chartData.length;
  const median = values[Math.floor(values.length / 2)];
  const top25pct = values[Math.floor(values.length * 0.75)] || avg;

  const topCategories: TopCategory[] = chartData.slice(0, 8).map((p, index) => ({
    ...p,
    share: (p.value / totalMetric) * 100,
    rank: index + 1
  }));

  const summary = `Analyzed ${rows.length.toLocaleString()} rows across ${headers.length} columns. ${dimensionColumn} = "${topCategories[0]?.category}" leads ${metricColumn} with ${topCategories[0]?.value.toLocaleString()} (${topCategories[0]?.share.toFixed(1)}%). Average: ${avg.toLocaleString()}.`;

  const analysisInsights = generateInsights({
    rowCount: rows.length,
    columnCount: headers.length,
    metricColumn,
    dimensionColumn,
    chartData,
    totalMetric,
    topCategories,
    summary: '',
    insights: [],
    trends: [],
    recommendations: [],
    benchmark: { avg, median, top25pct }
  });

  return {
    rowCount: rows.length,
    columnCount: headers.length,
    metricColumn,
    dimensionColumn,
    chartData,
    totalMetric,
    topCategories,
    summary,
    insights: analysisInsights.insights,
    trends: analysisInsights.trends,
    recommendations: analysisInsights.recommendations,
    benchmark: { avg, median: Number(median), top25pct }
  };
}

function trackEvent(event: any) {
  console.log('Analytics:', event);
}

export default function InsightStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(true);
  const [prompt, setPrompt] = useState('Show revenue by region.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dashboard controls
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [topN, setTopN] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [tableSortBy, setTableSortBy] = useState<'category' | 'value' | 'share'>('value');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent({ eventType: 'page_view', page: '/insight-studio' });
    
    let interval: NodeJS.Timeout;
    if (autoRefresh && result) {
      interval = setInterval(() => {
        handleGenerate();
      }, 30000); // Auto refresh every 30s
    }
    return () => clearInterval(interval);
  }, [autoRefresh, result]);

  const showToast = useCallback((message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.size > 10 * 1024 * 1024) {
      showToast('File too large. Max 10MB.', 'error');
      return;
    }
    setFile(selected);
    setUseSample(false);
    setError(null);
  };

  const runAnalysis = useCallback((csvText: string) => {
    const analysis = analyzeData(parseCsv(csvText).headers, parseCsv(csvText).rows, prompt);
    setResult(analysis);
    showToast(`✅ Dashboard ready! ${analysis.metricColumn} by ${analysis.dimensionColumn}`, 'success');
    
    trackEvent({
      eventType: 'analysis_complete',
      metric: analysis.metricColumn,
      dimension: analysis.dimensionColumn,
      rows: analysis.rowCount,
      categories: analysis.chartData.length
    });
  }, [prompt, showToast]);

  const handleGenerate = useCallback(() => {
    setError(null);
    setResult(null);

    if (!useSample && !file) {
      showToast('Please upload CSV or use demo data', 'error');
      return;
    }

    setLoading(true);

    const finish = (csvText: string) => {
      try {
        runAnalysis(csvText);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (useSample) {
      finish(SAMPLE_CSV);
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => finish(String(reader.result));
      reader.onerror = () => {
        setLoading(false);
        showToast('Failed to read file', 'error');
      };
      reader.readAsText(file);
    }
  }, [file, useSample, runAnalysis, showToast]);

  const filteredChartData = useMemo(() => {
    if (!result) return [];
    
    return result.chartData
      .filter(p => p.value > 0 && 
        (categoryFilter ? p.category.toLowerCase().includes(categoryFilter.toLowerCase()) : true))
      .sort((a, b) => sortDirection === 'desc' ? b.value - a.value : a.value - b.value)
      .slice(0, topN);
  }, [result, categoryFilter, sortDirection, topN]);

  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#14b8a6', '#84cc16', '#ec4899',
    '#a855f7', '#6366f1', '#0ea5e9', '#f43f5e'
  ];

  const exportCSV = () => {
    if (!result) return;
    const csv = [
      [result.dimensionColumn, result.metricColumn, 'Share %'],
      ...result.chartData.map(d => [d.category, d.value, (d.value/result.totalMetric*100).toFixed(2)])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-${result.dimensionColumn}-${result.metricColumn}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 CSV exported successfully', 'success');
  };

  const exportPDF = () => {
    if (!chartRef.current) return;
    
    const canvas = chartRef.current.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'dashboard.png';
      link.href = canvas.toDataURL();
      link.click();
      showToast('📈 Chart exported as PNG', 'success');
    }
  };

  const renderChart = () => {
    if (filteredChartData.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm text-center">No data matches current filters</p>
        </div>
      );
    }

    const commonProps = {
      data: filteredChartData,
      margin: { top: 5, right: 20, bottom: 40, left: 0 }
    };

    const tooltipFormatter = (value: number) => [
      value.toLocaleString(),
      result?.metricColumn || ''
    ];

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/>
              </linearGradient>
              <pattern id="barPattern" width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="2" height="2" fill="#3b82f6"/>
              </pattern>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="category" tick={{fontSize: 11, fill: '#9ca3af'}} interval={0} angle={-45} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} />
            <Tooltip formatter={tooltipFormatter} cursor={{fill: 'rgba(59,130,246,0.08)'}} />
            <ReferenceLine y={result?.benchmark.avg || 0} label="Avg" stroke="rgba(16,185,129,0.6)" strokeDasharray="3 3" />
            <Bar dataKey="value" fill="url(#barGradient)" radius={[6,6,0,0]}>
              {filteredChartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="category" tick={{fontSize: 11, fill: '#9ca3af'}} interval={0} angle={-45} height={60}/>
            <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} />
            <Tooltip formatter={tooltipFormatter} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{fill: '#10b981', strokeWidth: 2}} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="category" tick={{fontSize: 11, fill: '#9ca3af'}} interval={0} angle={-45} height={60}/>
            <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} />
            <Tooltip formatter={tooltipFormatter} />
            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#areaGradient)" />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={filteredChartData.slice(0, 10)}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={85}
              innerRadius={35}
              paddingAngle={2}
              cornerRadius={6}
            >
              {filteredChartData.slice(0, 10).map((entry, index) => (
                <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  const sortedTableData = useMemo(() => {
    if (!result) return [];
    return [...result.chartData].sort((a, b) => {
      let aVal = tableSortBy === 'category' ? a.category : 
                tableSortBy === 'share' ? (a.value/result!.totalMetric*100) : a.value;
      let bVal = tableSortBy === 'category' ? b.category : 
                tableSortBy === 'share' ? (b.value/result!.totalMetric*100) : b.value;
      
      if (tableSortBy === 'category') {
        return tableSortDir === 'asc' ? 
          a.category.localeCompare(b.category) : 
          b.category.localeCompare(a.category);
      }
      
      return tableSortDir === 'asc' ? 
        (aVal as number) - (bVal as number) : 
        (bVal as number) - (aVal as number);
    });
  }, [result, tableSortBy, tableSortDir]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-x-hidden">
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .gradient-shift {
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float { animation: float 6s ease-in-out infinite; }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl float" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-start">
          {/* Control Panel */}
          <div className="lg:sticky lg:top-24 space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 backdrop-blur-xl">
                <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">AI Data Studio Pro</span>
                <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>
              
              <div>
                <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent leading-tight">
                  Transform
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Raw Data</span>
                  <br />
                  Into Actionable Insights
                </h1>
                <p className="text-xl text-slate-300 mt-6 max-w-lg leading-relaxed">
                  Upload any CSV. Ask in plain English. Get instant interactive dashboards, 
                  AI-powered analysis, and executive-ready reports. No code required.
                </p>
              </div>
            </div>

            {/* Input Controls */}
            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/2 backdrop-blur-3xl p-8 shadow-2xl shadow-blue-500/10">
              {/* Data Source Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Data Source</p>
                    <p className="text-xs text-slate-400">CSV • Up to 10MB • Browser processing</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {setUseSample(true); setFile(null);}}
                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      useSample 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' 
                        : 'bg-white/5 border border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Demo Dataset
                  </button>
                  <button
                    onClick={() => setUseSample(false)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      !useSample 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' 
                        : 'bg-white/5 border border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Upload CSV
                  </button>
                </div>
              </div>

              {/* File Upload */}
              {!useSample && (
                <label className="group relative block">
                  <input 
                    type="file" 
                    accept=".csv,.tsv" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="rounded-2xl border-2 border-dashed border-white/20 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-8 text-center hover:border-blue-400/60 hover:bg-blue-500/5 transition-all duration-300 group-hover:scale-[1.02]">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <p className="text-lg font-semibold text-white mb-1">Drop CSV or click to upload</p>
                    <p className="text-sm text-slate-400 mb-4">Processed instantly in your browser</p>
                    {file && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        {file.name}
                      </div>
                    )}
                  </div>
                </label>
              )}

              {useSample && (
                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl flex-shrink-0">
                      <BarChart3 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-300 mb-1">✅ Demo Dataset Active</p>
                      <p className="text-xs text-emerald-200">12 months of regional revenue data • Ready for instant analysis</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Prompt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  AI Analysis Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/20 bg-slate-900/50 px-5 py-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent resize-none transition-all"
                  placeholder="e.g. 'Show revenue by region and highlight top performers', 'Compare sales performance across categories', 'Analyze profit margins by product type'"
                />
                <p className="text-xs text-slate-500 mt-2">AI automatically detects metrics and categories from your natural language request</p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-200 text-sm">{error}</p>
                    <p className="text-xs text-red-300 mt-1">Try adjusting your CSV format or prompt</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading || (!useSample && !file)}
                  className="flex-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin-slow" />
                      Generate Dashboard
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-3 rounded-2xl border-2 transition-all ${
                    autoRefresh 
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-emerald-500/20' 
                      : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                  title="Auto-refresh every 30s"
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Professional Dashboard */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Dashboard Header */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-blue-500/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                    <Activity className="w-3 h-3" />
                    LIVE ANALYTICS DASHBOARD
                  </div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    Executive Insights
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {result && (
                    <>
                      <button onClick={exportCSV} className="p-2 hover:bg-white/10 rounded-xl transition-all group">
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                      <button 
                        onClick={exportPDF} 
                        className="p-2 hover:bg-white/10 rounded-xl transition-all group"
                        title="Export chart"
                      >
                        <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {result && (
                <div className="grid grid-cols-3 gap-4 text-xs mb-6">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-4">
                    <p className="text-slate-400 mb-1">Dataset Size</p>
                    <p className="font-mono text-lg font-black text-blue-300">
                      {result.rowCount.toLocaleString()}
                    </p>
                    <p className="text-blue-300 text-[10px]">rows</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 p-4">
                    <p className="text-slate-400 mb-1">Total {result.metricColumn}</p>
                    <p className="font-mono text-lg font-black text-emerald-300">
                      {result.totalMetric.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 p-4">
                    <p className="text-slate-400 mb-1">Categories</p>
                    <p className="font-mono text-lg font-black text-purple-300">
                      {result.chartData.length}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Chart */}
            <div ref={chartRef} className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-2xl p-8 shadow-2xl shadow-blue-500/5 flex flex-col h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <div className="w-24 h-24 border-4 border-slate-700/50 border-t-gradient-blue rounded-full animate-spin" />
                  <div className="space-y-2">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full w-48 mx-auto animate-pulse" />
                    <div className="h-2 bg-slate-700/50 rounded-full w-32 mx-auto animate-pulse delay-500" />
                  </div>
                  <p className="text-slate-400 text-sm">AI analyzing your data structure...</p>
                </div>
              ) : !result ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
                  <BarChart3 className="w-20 h-20 opacity-30" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Ready for Analysis</h3>
                    <p>Upload data → Add prompt → Generate instant insights</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chart Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 font-semibold">
                      <div className={`p-1.5 rounded-lg ${chartType === 'bar' ? 'bg-blue-500/20 border-blue-500/40' : 'bg-slate-800/30'}`}>
                        <BarChart3 className={`w-4 h-4 ${chartType === 'bar' ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                      <span>{result.metricColumn} by {result.dimensionColumn}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Chart Type */}
                      <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-white/20 shadow-lg">
                        {(['bar', 'line', 'area', 'pie'] as const).map((type) => {
                          const Icon = type === 'bar' ? BarChart3 : type === 'line' ? LineChartIcon : type === 'pie' ? PieChart : BarChart3;
                          return (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                chartType === type
                                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40' 
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {type}
                            </button>
                          );
                        })}
                      </div>

                      {/* Filters */}
                      <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-white/20 shadow-lg">
                        <div className="relative">
                          <input
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            placeholder={`Filter ${result.dimensionColumn}...`}
                            className="w-32 pl-9 pr-3 py-2 text-xs bg-transparent text-white placeholder-slate-500 border-none focus:outline-none rounded-xl"
                          />
                          <Filter className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <select
                          value={topN}
                          onChange={(e) => setTopN(Number(e.target.value))}
                          className="py-2 px-3 text-xs bg-transparent text-white border-none focus:outline-none rounded-xl"
                        >
                          {[8, 12, 16, 24].map(n => <option key={n}>Top {n}</option>)}
                        </select>
                        <button
                          onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart()}
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            {result && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="group p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl hover:border-blue-500/40 transition-all hover:shadow-blue-500/10">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Top Performer</span>
                    </div>
                    <p className="text-2xl font-black text-white">{result.topCategories[0]?.value?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{result.topCategories[0]?.category}</p>
                  </div>
                  
                  <div className="group p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl hover:border-emerald-500/40 transition-all hover:shadow-emerald-500/10">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Avg {result.metricColumn}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{result.benchmark.avg.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Benchmark</p>
                  </div>

                  <div className="group p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl hover:border-purple-500/40 transition-all hover:shadow-purple-500/10">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Concentration</span>
                    </div>
                    <p className="text-2xl font-black text-white">{result.topCategories[0]?.share?.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">Top category</p>
                  </div>

                  <div className="group p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl hover:border-orange-500/40 transition-all hover:shadow-orange-500/10">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Categories</span>
                    </div>
                    <p className="text-2xl font-black text-white">{filteredChartData.length}</p>
                    <p className="text-xs text-slate-400">Visible</p>
                  </div>
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI Insights */}
                  <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-slate-900/30 to-emerald-500/5 backdrop-blur-xl p-6 shadow-2xl shadow-emerald-500/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/20 rounded-2xl">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-300 mb-1">AI Insights</h3>
                        <p className="text-xs text-emerald-200">Automated analysis highlights</p>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {result.insights.map((insight, i) => (
                        <div key={i} className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-emerald-400/30">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-sm leading-relaxed">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-slate-900/30 to-blue-500/5 backdrop-blur-xl p-6 shadow-2xl shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/20 rounded-2xl">
                        <Award className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-300 mb-1">🏆 Top Performers</h3>
                        <p className="text-xs text-blue-200">Ranked by total {result.metricColumn}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {result.topCategories.slice(0, 6).map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              #{cat.rank}
                            </div>
                            <span className="font-semibold text-white min-w-0 truncate">{cat.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-emerald-400 text-lg">{cat.value.toLocaleString()}</p>
                            <p className="text-xs text-emerald-300">{cat.share.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-slate-400" />
                      <h4 className="font-semibold text-slate-200">Complete Dataset</h4>
                    </div>
                    <span className="text-xs text-slate-500">{sortedTableData.length} rows • {result.metricColumn} by {result.dimensionColumn}</span>
                  </div>
                  
                  <div className="max-h-40 overflow-auto rounded-2xl border border-white/5 bg-slate-900/30">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-3 text-left cursor-pointer group hover:text-white pr-2" onClick={() => {
                            const next = tableSortBy === 'category' && tableSortDir === 'asc' ? 'desc' : 'asc';
                            setTableSortBy('category'); setTableSortDir(next);
                          }}>
                            <div className="flex items-center gap-1 font-semibold">
                              Category
                              <ChevronDown className={`w-3 h-3 transition-transform ${tableSortBy === 'category' ? (tableSortDir === 'desc' ? 'rotate-0' : 'rotate-180') : ''}`} />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right cursor-pointer group hover:text-white" onClick={() => {
                            const next = tableSortBy === 'value' && tableSortDir === 'asc' ? 'desc' : 'asc';
                            setTableSortBy('value'); setTableSortDir(next);
                          }}>
                            <div className="flex items-center justify-end gap-1 font-semibold">
                              {result.metricColumn}
                              <ChevronDown className={`w-3 h-3 transition-transform ${tableSortBy === 'value' ? (tableSortDir === 'desc' ? 'rotate-0' : 'rotate-180') : ''}`} />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right cursor-pointer group hover:text-white" onClick={() => {
                            const next = tableSortBy === 'share' && tableSortDir === 'asc' ? 'desc' : 'asc';
                            setTableSortBy('share'); setTableSortDir(next);
                          }}>
                            <div className="flex items-center justify-end gap-1 font-semibold">
                              Share %
                              <ChevronDown className={`w-3 h-3 transition-transform ${tableSortBy === 'share' ? (tableSortDir === 'desc' ? 'rotate-0' : 'rotate-180') : ''}`} />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTableData.slice(0, 15).map((row, i) => (
                          <tr key={row.category} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{row.category}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                              {row.value.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-400">
                              {((row.value/result!.totalMetric)*100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 rounded-2xl px-6 py-4 shadow-2xl border backdrop-blur-xl text-sm font-semibold transform transition-all scale-100 ${
          toast.tone === 'error' 
            ? 'bg-red-600/20 border-red-500/40 shadow-red-500/25 text-red-100 animate-bounce' 
            : toast.tone === 'success'
            ? 'bg-emerald-600/20 border-emerald-500/40 shadow-emerald-500/25 text-emerald-100'
            : 'bg-blue-600/20 border-blue-500/40 shadow-blue-500/25 text-blue-100'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
