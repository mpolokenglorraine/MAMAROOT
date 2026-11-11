import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, Calendar, Activity, Info, Sparkles } from 'lucide-react';
import { Symptom } from '../lib/supabase';

interface HealthTrendChartProps {
  symptoms: Symptom[];
}

// 3-Month mock / baseline cycle data when user is tracking cycle duration
const DEFAULT_3_MONTH_CYCLES = [
  { month: 'Jul', dateLabel: 'Jul 14', cycleDay: 28, lutealPhase: 13, periodDuration: 5, flowScore: 'Moderate', notes: 'Regular rhythm, balanced energy' },
  { month: 'Aug', dateLabel: 'Aug 11', cycleDay: 29, lutealPhase: 14, periodDuration: 4, flowScore: 'Mild', notes: 'Slightly longer follicular window' },
  { month: 'Sep', dateLabel: 'Sep 09', cycleDay: 28, lutealPhase: 13, periodDuration: 5, flowScore: 'Moderate', notes: 'Comfortable ovulation signs' },
  { month: 'Oct', dateLabel: 'Oct 08', cycleDay: 27, lutealPhase: 12, periodDuration: 4, flowScore: 'Mild', notes: 'Current cycle onset' },
];

export function HealthTrendChart({ symptoms }: HealthTrendChartProps) {
  const [metricMode, setMetricMode] = useState<'symptoms' | 'cycle'>('symptoms');
  const [symptomFilter, setSymptomFilter] = useState<string>('all');

  // Compute 3-Month Symptom Trend Data
  const { chartData, uniqueSymptomTypes, avgSeverity, totalLogs } = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Filter symptoms within 3 months (or fallback to all existing if logged recently)
    const recentSymptoms = symptoms.filter(s => {
      const d = new Date(s.created_at);
      return d >= threeMonthsAgo || symptoms.length <= 15;
    });

    const typesSet = new Set<string>();
    symptoms.forEach(s => typesSet.add(s.type));
    const uniqueTypes = Array.from(typesSet);

    // If the user has real symptoms logged, group them by week/date points
    if (recentSymptoms.length > 0) {
      // Sort chronologically ascending
      const sorted = [...recentSymptoms].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Filter by selected symptom type if not 'all'
      const filtered = symptomFilter === 'all' 
        ? sorted 
        : sorted.filter(s => s.type === symptomFilter);

      // Group or format into chronological items
      const dataPoints = filtered.map((item) => {
        const d = new Date(item.created_at);
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          date: formattedDate,
          fullDate: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          severity: item.severity,
          type: item.type,
          notes: item.notes || 'No notes logged',
        };
      });

      const avg = filtered.length > 0
        ? (filtered.reduce((acc, curr) => acc + curr.severity, 0) / filtered.length).toFixed(1)
        : '0';

      return {
        chartData: dataPoints,
        uniqueSymptomTypes: uniqueTypes,
        avgSeverity: avg,
        totalLogs: filtered.length,
      };
    }

    // Default 3-month sample trend if user has not logged enough symptoms yet
    const sampleTrend = [
      { date: 'Aug 04', fullDate: 'August 4, 2026', severity: 2, type: 'Fatigue', notes: 'Gentle morning lethargy' },
      { date: 'Aug 18', fullDate: 'August 18, 2026', severity: 4, type: 'Cramping', notes: 'Mid-cycle ovulation twinge' },
      { date: 'Sep 02', fullDate: 'September 2, 2026', severity: 5, type: 'Lower Back Ache', notes: 'Comforted by warm bath' },
      { date: 'Sep 16', fullDate: 'September 16, 2026', severity: 3, type: 'Fatigue', notes: 'Restored after early night' },
      { date: 'Sep 29', fullDate: 'September 29, 2026', severity: 6, type: 'Nausea', notes: 'Soothed by warm ginger broth' },
      { date: 'Oct 08', fullDate: 'October 8, 2026', severity: 3, type: 'Sleep Disruption', notes: 'Noticed hormonal temperature shift' },
    ];

    return {
      chartData: sampleTrend,
      uniqueSymptomTypes: ['Fatigue', 'Cramping', 'Lower Back Ache', 'Nausea', 'Sleep Disruption'],
      avgSeverity: '3.8',
      totalLogs: sampleTrend.length,
    };
  }, [symptoms, symptomFilter]);

  const isSampleData = symptoms.length === 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAD5C0] shadow-xs space-y-6">
      {/* Chart Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAD5C0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#F7CCA5] text-[#3B1409]">
              <TrendingUp className="w-4 h-4 text-[#3B1409]" />
            </span>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              3-Month Health & Rhythm Trends
            </h2>
          </div>
          <p className="text-xs text-[#6B4A3A] mt-1 font-sans">
            Visualizing your body's patterns, intensity shifts, and cycle consistency.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-[#FFF9F2] p-1 rounded-full border border-[#EAD5C0] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('symptoms')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              metricMode === 'symptoms'
                ? 'bg-[#A9421B] text-white shadow-2xs'
                : 'text-[#6B4A3A] hover:text-[#3B1409]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Symptom Intensity</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('cycle')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              metricMode === 'cycle'
                ? 'bg-[#3B1409] text-white shadow-2xs'
                : 'text-[#6B4A3A] hover:text-[#3B1409]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cycle Length</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricMode === 'symptoms' ? (
          <>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Average Intensity</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-[#3B1409]">{avgSeverity}</span>
                <span className="text-[10px] text-[#6B4A3A]">/ 10</span>
              </div>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Logged Check-ins</span>
              <span className="text-lg font-bold text-[#A9421B] mt-0.5 block">{totalLogs}</span>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Window Period</span>
              <span className="text-xs font-semibold text-[#3B1409] mt-1 block">Past 90 Days</span>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Pattern Status</span>
              <span className="text-xs font-semibold text-[#A9421B] mt-1 block">Gentle & Stable</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Avg Cycle Duration</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-[#3B1409]">28</span>
                <span className="text-[10px] text-[#6B4A3A]">days</span>
              </div>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Average Bleeding</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-[#A9421B]">4.5</span>
                <span className="text-[10px] text-[#6B4A3A]">days</span>
              </div>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Cycle Consistency</span>
              <span className="text-xs font-semibold text-[#3B1409] mt-1 block">Regular (±1 day)</span>
            </div>
            <div className="p-3.5 bg-[#FFF9F2] rounded-2xl border border-[#EAD5C0]">
              <span className="text-[10px] font-bold text-[#6B4A3A] uppercase tracking-wider block">Rhythm Stage</span>
              <span className="text-xs font-semibold text-[#A9421B] mt-1 block">Follicular</span>
            </div>
          </>
        )}
      </div>

      {/* Symptom Type Filter (when in symptoms mode) */}
      {metricMode === 'symptoms' && uniqueSymptomTypes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[11px] font-medium text-[#6B4A3A] shrink-0">Filter Symptom:</span>
          <button
            type="button"
            onClick={() => setSymptomFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              symptomFilter === 'all'
                ? 'bg-[#A9421B] text-white border-[#A9421B]'
                : 'bg-white text-[#6B4A3A] border-[#B89A82] hover:bg-[#F6E7D8]'
            }`}
          >
            All Symptoms
          </button>
          {uniqueSymptomTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSymptomFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                symptomFilter === t
                  ? 'bg-[#3B1409] text-white border-[#3B1409]'
                  : 'bg-white text-[#6B4A3A] border-[#B89A82] hover:bg-[#F6E7D8]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Notice if displaying sample baseline */}
      {isSampleData && metricMode === 'symptoms' && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F6E7D8] text-[11px] text-[#3B1409] border border-[#EAD5C0]">
          <Sparkles className="w-3.5 h-3.5 text-[#A9421B] shrink-0" />
          <span>
            Showing illustrative 3-month sample trend. Once you log daily check-ins above, this line chart will automatically render your personal records.
          </span>
        </div>
      )}

      {/* Recharts Container */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === 'symptoms' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <defs>
                {/* Terracotta gradient fill for symptom severity */}
                <linearGradient id="terracottaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A9421B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A9421B" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#EAD5C0" vertical={false} />
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6B4A3A', fontSize: 11, fontFamily: 'DM Sans' }}
                stroke="#EAD5C0"
                tickLine={false}
                axisLine={{ stroke: '#EAD5C0' }}
              />
              
              <YAxis 
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fill: '#6B4A3A', fontSize: 11, fontFamily: 'DM Sans' }}
                stroke="#EAD5C0"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3.5 rounded-2xl border border-[#EAD5C0] shadow-md text-xs space-y-1 font-sans">
                        <p className="font-bold text-[#3B1409]">{data.fullDate || data.date}</p>
                        <p className="text-[#A9421B] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#A9421B]" />
                          {data.type}: Level {data.severity}/10
                        </p>
                        {data.notes && (
                          <p className="text-[11px] text-[#6B4A3A] italic max-w-xs pt-1 border-t border-[#EAD5C0]">
                            "{data.notes}"
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Moderate threshold line */}
              <ReferenceLine y={5} stroke="#EAD5C0" strokeDasharray="4 4" label={{ value: 'Moderate (5)', fill: '#6B4A3A', fontSize: 10, position: 'right' }} />

              <Area 
                type="monotone" 
                dataKey="severity" 
                stroke="#A9421B" 
                fillOpacity={1} 
                fill="url(#terracottaGradient)" 
              />

              <Line 
                type="monotone" 
                dataKey="severity" 
                stroke="#3B1409" 
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#FFF9F2', stroke: '#3B1409', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#A9421B', stroke: '#FFF9F2', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            <LineChart
              data={DEFAULT_3_MONTH_CYCLES}
              margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EAD5C0" vertical={false} />
              
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fill: '#6B4A3A', fontSize: 11, fontFamily: 'DM Sans' }}
                stroke="#EAD5C0"
                tickLine={false}
                axisLine={{ stroke: '#EAD5C0' }}
              />
              
              <YAxis 
                domain={[24, 32]}
                ticks={[24, 26, 28, 30, 32]}
                tick={{ fill: '#6B4A3A', fontSize: 11, fontFamily: 'DM Sans' }}
                stroke="#EAD5C0"
                tickLine={false}
                axisLine={false}
                unit="d"
              />

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3.5 rounded-2xl border border-[#EAD5C0] shadow-md text-xs space-y-1 font-sans">
                        <p className="font-bold text-[#3B1409]">Onset Date: {data.dateLabel}</p>
                        <p className="text-[#A9421B] font-semibold">
                          Total Cycle Duration: <strong>{data.cycleDay} days</strong>
                        </p>
                        <p className="text-[11px] text-[#6B4A3A]">
                          Bleeding: {data.periodDuration} days • Flow: {data.flowScore}
                        </p>
                        <p className="text-[11px] text-[#3B1409] italic pt-1 border-t border-[#EAD5C0]">
                          {data.notes}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine y={28} stroke="#EAD5C0" strokeDasharray="4 4" label={{ value: 'Typical (28d)', fill: '#6B4A3A', fontSize: 10, position: 'right' }} />

              <Line 
                type="monotone" 
                dataKey="cycleDay" 
                name="Cycle Duration (Days)"
                stroke="#3B1409" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#FFF9F2', stroke: '#3B1409', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#A9421B', stroke: '#FFF9F2', strokeWidth: 2 }}
              />

              <Line 
                type="monotone" 
                dataKey="periodDuration" 
                name="Bleeding Days"
                stroke="#833518" 
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#833518' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6B4A3A] pt-2 border-t border-[#EAD5C0] gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#A9421B]" />
          <span>
            {metricMode === 'symptoms' 
              ? 'Scores from 1 (mild) to 10 (severe). Consult your doctor if symptoms stay above 7.' 
              : 'Consistent 24–35 day intervals represent healthy physiological cycle variability.'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-[#3B1409]">
          Mama Root Care • Confidential
        </span>
      </div>
    </div>
  );
}

export default HealthTrendChart;
