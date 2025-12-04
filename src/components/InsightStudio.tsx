import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles, BarChart3, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { trackEvent } from '../lib/supabaseClient';

interface ChartPoint {
  category: string;
  value: number;
}

interface TopCategory extends ChartPoint {
  share: number; // percentage share of total metric
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
}

const SAMPLE_CSV = `Region,Month,Revenue,Customers
North,Jan,120000,320
North,Feb,135000,340
North,Mar,142000,355
South,Jan,95000,280
South,Feb,99000,295
South,Mar,105000,310
West,Jan,78000,220
West,Feb,82000,230
West,Mar,91000,245`;

function detectDelimiter(headerLine: string): string {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;

  for (const delim of candidates) {
    const count = headerLine.split(delim).length;
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }

  return best;
}

function normalizeText(text: string): string {
  // Strip BOM and leading/trailing whitespace
  return text.replace(/^\uFEFF/, '').trim();
}

function parseCsv(rawText: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanText = normalizeText(rawText);
  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row.');
  }

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);

  const headers = headerLine.split(delimiter).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(delimiter);
    if (parts.every((p) => p.trim() === '')) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (parts[index] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function isNumeric(value: string): boolean {
  if (value === '' || value == null) return false;
  const n = Number(value);
  return Number.isFinite(n);
}

function analyzeData(headers: string[], rows: Record<string, string>[], prompt: string): AnalysisResult {
  if (rows.length === 0) {
    throw new Error('No data rows found after cleaning. Please check that your file has data rows.');
  }

  const numericHeaders = headers.filter((h) => {
    const sampleValues = rows.slice(0, 50).map((r) => r[h]);
    const numericCount = sampleValues.filter((v) => isNumeric(v)).length;
    return numericCount / Math.max(sampleValues.length, 1) >= 0.6;
  });

  const categoricalHeaders = headers.filter((h) => !numericHeaders.includes(h));

  if (numericHeaders.length === 0) {
    throw new Error('Could not find any numeric columns. Try including a revenue, amount or numeric metric column.');
  }

  const lowerPrompt = prompt.toLowerCase();

  const chooseColumn = (candidates: string[], fallback: string): string => {
    if (candidates.length === 0) return fallback;

    for (const col of candidates) {
      const name = col.toLowerCase();
      if (lowerPrompt.includes(name)) return col;
      const tokens = name.split(/[^a-z0-9]+/).filter(Boolean);
      if (tokens.some((t) => lowerPrompt.includes(t))) return col;
    }
    return fallback;
  };

  const metricColumn = chooseColumn(numericHeaders, numericHeaders[0]);
  const dimensionColumn = chooseColumn(
    categoricalHeaders.length > 0 ? categoricalHeaders : headers,
    (categoricalHeaders[0] ?? headers[0])
  );

  const grouped = new Map<string, number>();

  for (const row of rows) {
    const dimKey = row[dimensionColumn] || 'Unknown';
    const rawMetric = row[metricColumn];
    const value = isNumeric(rawMetric) ? Number(rawMetric) : 0;
    grouped.set(dimKey, (grouped.get(dimKey) ?? 0) + value);
  }

  const chartData: ChartPoint[] = Array.from(grouped.entries()).map(([category, value]) => ({
    category,
    value,
  }));

  chartData.sort((a, b) => b.value - a.value);

  const totalMetric = chartData.reduce((sum, p) => sum + p.value, 0);

  if (!Number.isFinite(totalMetric) || totalMetric === 0) {
    throw new Error(
      `All values for ${metricColumn} are zero or non-numeric. Try a different metric column in your prompt.`
    );
  }

  const topCategories: TopCategory[] = chartData.slice(0, 5).map((p) => ({
    ...p,
    share: (p.value / totalMetric) * 100,
  }));

  const top = chartData[0];
  const rowCount = rows.length;
  const columnCount = headers.length;

  const summary = top
    ? `From ${rowCount.toLocaleString()} rows across ${columnCount} columns, ${dimensionColumn} = "${top.category}" has the highest total ${metricColumn} of ${top.value.toLocaleString()} (${(
        (top.value / totalMetric) *
        100
      ).toFixed(1)}% of total).`
    : `Analyzed ${rowCount.toLocaleString()} rows across ${columnCount} columns.`;

  return {
    rowCount,
    columnCount,
    metricColumn,
    dimensionColumn,
    chartData,
    totalMetric,
    topCategories,
    summary,
  };
}

export default function InsightStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(true);
  const [prompt, setPrompt] = useState('Show revenue by region.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // dashboard controls
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [topN, setTopN] = useState(8);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [tableSortBy, setTableSortBy] = useState<'category' | 'value'>('value');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('desc');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    trackEvent({ eventType: 'page_view', page: '/app' }).catch(() => {
      // non-blocking analytics
    });
  }, []);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => {
      setToast(null);
    }, 2600);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUseSample(false);
  };

  const runAnalysis = (csvText: string) => {
    const { headers, rows } = parseCsv(csvText);
    const analysis = analyzeData(headers, rows, prompt);
    setResult(analysis);
    showToast('Dashboard generated from your data', 'success');

    // fire-and-forget analytics
    trackEvent({
      eventType: 'analysis_run',
      page: '/app',
      metadata: {
        rowCount: analysis.rowCount,
        columnCount: analysis.columnCount,
        metricColumn: analysis.metricColumn,
        dimensionColumn: analysis.dimensionColumn,
        source: useSample ? 'demo' : 'upload',
      },
    }).catch(() => {
      // ignore analytics failures
    });
  };

  const handleGenerate = () => {
    setError(null);
    setResult(null);

    if (!useSample && !file) {
      setError('Upload a CSV file or switch to the demo dataset.');
      return;
    }

    setLoading(true);

    const finish = (csvText: string) => {
      try {
        runAnalysis(csvText);
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Failed to analyze data.';
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
      reader.onload = () => {
        const text = String(reader.result ?? '');
        finish(text);
      };
      reader.onerror = () => {
        setLoading(false);
        setError('Could not read the uploaded file.');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 text-sm text-slate-400">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to landing page
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Sparkles className="w-3 h-3" />
              InsightAI Studio • Free Trial
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Turn raw data into live dashboards
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-xl">
              Upload a CSV or try the demo dataset, describe what you want to see, and let InsightAI clean your data,
              choose the right metrics, and build an interactive dashboard for you.
            </p>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    Data source
                  </p>
                  <p className="text-xs text-slate-400">Upload your own CSV or start instantly with demo data.</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseSample(true)}
                    className={`px-3 py-1 rounded-full border ${
                      useSample
                        ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 text-slate-300 hover:border-white/40'
                    }`}
                  >
                    Use demo data
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSample(false)}
                    className={`px-3 py-1 rounded-full border ${
                      !useSample
                        ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 text-slate-300 hover:border-white/40'
                    }`}
                  >
                    Upload CSV
                  </button>
                </div>
              </div>

              {!useSample && (
                <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-slate-950/40 px-4 py-6 cursor-pointer hover:border-blue-400/80 transition-colors">
                  <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  <Upload className="w-6 h-6 text-blue-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Drop a CSV here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Up to ~5MB. We run everything in your browser.</p>
                    {file && <p className="text-xs text-slate-300 mt-2">Selected: {file.name}</p>}
                  </div>
                </label>
              )}

              {useSample && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Demo dataset loaded</p>
                    <p>We preloaded a small revenue-by-region dataset so you can see the full experience in one click.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2" htmlFor="prompt">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  What do you want to see?
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  placeholder="e.g. Compare monthly revenue by region and highlight the strongest performers."
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Analyzing data…' : 'Generate insights'}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-6 shadow-2xl min-h-[360px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">AI dashboard preview</p>
                  <p className="text-sm font-semibold text-white">Live from your data</p>
                </div>
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>

              {error && !result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-red-300 text-sm gap-2">
                  <AlertTriangle className="w-7 h-7" />
                  <p className="font-medium">We couldn&apos;t build your dashboard</p>
                  <p className="text-red-200/80 max-w-xs">{error}</p>
                </div>
              )}

              {!error && !result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-sm">
                  <BarChart3 className="w-8 h-8 mb-3 text-slate-500" />
                  <p className="font-medium text-slate-200 mb-1">No dashboard yet</p>
                  <p>Run an analysis to see an interactive chart and narrative summary here.</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex-col space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-slate-800/80 animate-pulse" />
                    <div className="h-16 rounded-xl bg-slate-800/80 animate-pulse" />
                  </div>
                  <div className="h-40 rounded-xl bg-slate-800/80 animate-pulse" />
                  <div className="h-10 rounded-xl bg-slate-800/80 animate-pulse" />
                </div>
              )}

              {result && !loading && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* headline stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                      <p className="text-slate-400 mb-1">Dataset size</p>
                      <p className="text-sm font-semibold text-white">
                        {result.rowCount.toLocaleString()} rows
                        <span className="text-slate-400 text-[11px]"> • {result.columnCount} cols</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                      <p className="text-slate-400 mb-1">Chart focus</p>
                      <p className="text-[11px] text-slate-200">
                        Metric <span className="font-semibold">{result.metricColumn}</span>
                        <span className="text-slate-500"> by </span>
                        <span className="font-semibold">{result.dimensionColumn}</span>
                      </p>
                    </div>
                  </div>

                  {/* main chart & controls */}
                  <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>AI-generated dashboard • top categories</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-full bg-slate-950/60 p-0.5 border border-white/10">
                          {(
                            [
                              { id: 'bar', label: 'Bar' },
                              { id: 'line', label: 'Line' },
                              { id: 'area', label: 'Area' },
                              { id: 'pie', label: 'Pie' },
                            ] as const
                          ).map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setChartType(option.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] ${
                                chartType === option.id
                                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/40'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                          <input
                            type="text"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            placeholder={`Filter ${result.dimensionColumn.toLowerCase()}…`}
                            className="w-28 rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/70"
                          />
                          <select
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value) || 8)}
                            className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/70"
                          >
                            {[5, 8, 12, 20].map((n) => (
                              <option key={n} value={n}>
                                Top {n}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                            className="text-[11px] text-slate-300 hover:text-white"
                          >
                            {sortDirection === 'desc' ? 'Sort: High → Low' : 'Sort: Low → High'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="h-44">
                      {(() => {
                        const base = result.chartData.filter((p) => p.value > 0);
                        const filtered = base.filter((p) =>
                          categoryFilter.trim()
                            ? p.category.toLowerCase().includes(categoryFilter.trim().toLowerCase())
                            : true
                        );

                        const sorted = [...filtered].sort((a, b) => {
                          const diff = a.value - b.value;
                          return sortDirection === 'desc' ? -diff : diff;
                        });

                        const data = sorted.slice(0, topN);

                        if (data.length === 0) {
                          return (
                            <div className="h-full flex items-center justify-center text-[11px] text-slate-500">
                              No numeric values detected for {result.metricColumn}. Try a different metric column in your
                              prompt.
                            </div>
                          );
                        }

                        const commonProps = {
                          data,
                          margin: { top: 10, right: 10, bottom: 10, left: 0 },
                        } as const;

                        const chartElement = (() => {
                          if (chartType === 'bar') {
                            return (
                              <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis
                                  dataKey="category"
                                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                                  interval={0}
                                  hide={false}
                                />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar
                                  dataKey="value"
                                  name={result.metricColumn}
                                  fill="url(#insight-bar)"
                                  radius={[4, 4, 0, 0]}
                                />
                                <defs>
                                  <linearGradient id="insight-bar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.95} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.7} />
                                  </linearGradient>
                                </defs>
                              </BarChart>
                            );
                          }

                          if (chartType === 'line') {
                            return (
                              <LineChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={0} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ stroke: '#22d3ee', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  name={result.metricColumn}
                                  stroke="#22d3ee"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            );
                          }

                          if (chartType === 'area') {
                            return (
                              <LineChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={0} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ fill: 'rgba(56, 189, 248, 0.06)' }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  name={result.metricColumn}
                                  stroke="#38bdf8"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            );
                          }

                          return (
                            <PieChart>
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Pie
                                data={data}
                                dataKey="value"
                                nameKey="category"
                                innerRadius="45%"
                                outerRadius="80%"
                                paddingAngle={2}
                              />
                            </PieChart>
                          );
                        })();

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartElement}
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>

                  {/* top performers table */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Top performers</span>
                      <span className="text-[11px] text-slate-500">
                        Total {result.metricColumn}: {result.totalMetric.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {result.topCategories.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-200 truncate max-w-[7rem]" title={cat.category}>
                            {cat.category}
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {cat.value.toLocaleString()} ({cat.share.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* aggregated table & export */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-[11px] text-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Aggregated view</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded-full bg-slate-950/70 border border-white/10 hover:border-blue-400/70 text-[11px] text-slate-100"
                          onClick={() => {
                            if (!result) return;
                            const rows = result.chartData.map((row) => ({
                              [result.dimensionColumn]: row.category,
                              [result.metricColumn]: row.value,
                            }));
                            const header = `${result.dimensionColumn},${result.metricColumn}`;
                            const body = rows
                              .map((r) => `${String(r[result.dimensionColumn])},${String(r[result.metricColumn])}`)
                              .join('\n');
                            const csvContent = `${header}\n${body}`;
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'insightai-aggregated-data.csv';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            showToast('Exported aggregated CSV', 'success');
                          }}
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-full bg-slate-950/70 border border-white/10 hover:border-emerald-400/70 text-[11px] text-emerald-100"
                          onClick={() => {
                            if (!result) return;

                            const lines: string[] = [];
                            lines.push('InsightAI Studio Report');
                            lines.push('=======================');
                            lines.push('');
                            lines.push(`Metric: ${result.metricColumn}`);
                            lines.push(`Dimension: ${result.dimensionColumn}`);
                            lines.push('');
                            lines.push(result.summary);
                            lines.push('');
                            lines.push('Top categories:');
                            result.topCategories.forEach((cat) => {
                              lines.push(
                                `- ${cat.category}: ${cat.value.toLocaleString()} (${cat.share.toFixed(1)}%)`
                              );
                            });
                            lines.push('');
                            lines.push(`Total ${result.metricColumn}: ${result.totalMetric.toLocaleString()}`);

                            const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'insightai-report.txt';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            showToast('Downloaded text report', 'success');
                          }}
                        >
                          Download report
                        </button>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-auto border border-white/5 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/90">
                          <tr>
                            <th
                              className="px-2 py-1 cursor-pointer hover:text-white"
                              onClick={() => {
                                const next =
                                  tableSortBy === 'category' && tableSortDir === 'asc' ? 'desc' : 'asc';
                                setTableSortBy('category');
                                setTableSortDir(next);
                              }}
                            >
                              {result.dimensionColumn}
                            </th>
                            <th
                              className="px-2 py-1 cursor-pointer hover:text-white text-right"
                              onClick={() => {
                                const next =
                                  tableSortBy === 'value' && tableSortDir === 'asc' ? 'desc' : 'asc';
                                setTableSortBy('value');
                                setTableSortDir(next);
                              }}
                            >
                              {result.metricColumn}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows = [...result.chartData];
                            rows.sort((a, b) => {
                              if (tableSortBy === 'category') {
                                const diff = a.category.localeCompare(b.category);
                                return tableSortDir === 'asc' ? diff : -diff;
                              }
                              const diff = a.value - b.value;
                              return tableSortDir === 'asc' ? diff : -diff;
                            });

                            return rows.map((row) => (
                              <tr
                                key={row.category}
                                className="odd:bg-slate-900/40 even:bg-slate-900/10"
                              >
                                <td
                                  className="px-2 py-1 truncate max-w-[8rem]"
                                  title={row.category}
                                >
                                  {row.category}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {row.value.toLocaleString()}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* narrative insight */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-200 flex gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <p>{result.summary}</p>
                  </div>

                  {/* toast */}
                  {toast && (
                    <div
                      className={
                        toast.tone === 'error'
                          ? 'fixed bottom-6 right-6 z-50 rounded-md px-4 py-3 shadow-lg border text-xs bg-red-600/30 border-red-400 text-red-100'
                          : 'fixed bottom-6 right-6 z-50 rounded-md px-4 py-3 shadow-lg border text-xs bg-emerald-600/30 border-emerald-400 text-emerald-100'
                      }
                    >
                      {toast.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}