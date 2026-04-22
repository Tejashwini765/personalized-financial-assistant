import React, { useState, useEffect } from 'react';

export default function Analysis({ breakdown = {}, totalSpent = 0, monthLabel = '', email = '', activeMonth = '' }) {
  const [trendData, setTrendData] = useState([]);
  const [trendMonths, setTrendMonths] = useState(6); // Default: last 6 months
  const [loadingTrend, setLoadingTrend] = useState(false);

  // Fetch monthly trend data
  useEffect(() => {
    if (email) fetchTrend();
  }, [email, activeMonth]);

  const fetchTrend = async () => {
    setLoadingTrend(true);
    try {
      const res = await fetch(`http://localhost:8000/api/monthly-trend?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setTrendData(data.trend || []);
      }
    } catch (err) { console.error(err); }
    setLoadingTrend(false);
  };

  // Filter trend to selected months
  const visibleTrend = trendData.slice(-trendMonths);
  const maxSpent = Math.max(...visibleTrend.map(d => d.totalSpent), 1);

  // Sort categories by amount (exclude Income/Transfer already done in backend)
  const sortedCategories = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const topCategories = sortedCategories.slice(0, 6);
  const top3 = sortedCategories.slice(0, 3);

  // Colors for pie chart and categories
  const categoryColorPalette = [
    { fill: '#6c5dd3', bg: '#f8f5fd', text: '#6c5dd3' },
    { fill: '#00a86b', bg: '#e5fcf4', text: '#00a86b' },
    { fill: '#ff8c00', bg: '#fff4e5', text: '#ff8c00' },
    { fill: '#007edc', bg: '#eff9ff', text: '#007edc' },
    { fill: '#ff3b69', bg: '#fff0f4', text: '#ff3b69' },
    { fill: '#8b5cf6', bg: '#f5f0ff', text: '#8b5cf6' },
  ];

  const pieData = topCategories.map(([cat, amount], idx) => ({
    category: cat, amount,
    percentage: totalSpent > 0 ? (amount / totalSpent * 100) : 0,
    color: categoryColorPalette[idx % categoryColorPalette.length]
  }));

  const buildPieSlices = () => {
    if (pieData.length === 0) return null;
    let cumAngle = 0;
    return pieData.map((slice, idx) => {
      const angle = (slice.percentage / 100) * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      const x1 = 50 + 45 * Math.cos(startRad);
      const y1 = 50 + 45 * Math.sin(startRad);
      const x2 = 50 + 45 * Math.cos(endRad);
      const y2 = 50 + 45 * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      return (
        <path key={idx} d={`M50,50 L${x1},${y1} A45,45 0 ${largeArc},1 ${x2},${y2} Z`} fill={slice.color.fill} opacity="0.9" />
      );
    });
  };

  const categoryIcons = {
    'Food & Dining': 'restaurant', 'Shopping': 'shopping_bag', 'Groceries': 'local_grocery_store',
    'Transport': 'directions_car', 'Fuel': 'local_gas_station', 'Utilities': 'bolt',
    'Rent': 'home', 'Entertainment': 'movie', 'Health': 'favorite', 'Education': 'school',
    'Transfer': 'swap_horiz', 'Income': 'account_balance', 'Insurance': 'shield',
    'Investment': 'trending_up', 'Personal Care': 'spa', 'Travel': 'flight',
    'Charity': 'volunteer_activism', 'Miscellaneous': 'more_horiz',
  };

  // Build SVG line graph
  const buildLineGraph = () => {
    if (visibleTrend.length === 0) return null;

    const width = 600;
    const height = 200;
    const padL = 60, padR = 30, padT = 20, padB = 40;
    const graphW = width - padL - padR;
    const graphH = height - padT - padB;

    const points = visibleTrend.map((d, i) => {
      const x = padL + (i / Math.max(visibleTrend.length - 1, 1)) * graphW;
      const y = padT + graphH - (d.totalSpent / maxSpent) * graphH;
      return { x, y, ...d };
    });

    // Build smooth curve path
    const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    // Area fill path
    const areaPath = `${linePath} L${points[points.length - 1].x},${padT + graphH} L${points[0].x},${padT + graphH} Z`;

    // Y-axis labels (4 levels)
    const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
      value: maxSpent * pct,
      y: padT + graphH - pct * graphH
    }));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={padL} y1={yl.y} x2={width - padR} y2={yl.y} stroke="#f0f0f5" strokeWidth="1" />
            <text x={padL - 8} y={yl.y + 4} textAnchor="end" fill="#8c8c99" fontSize="8" fontWeight="700">
              ₹{(yl.value / 1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c5dd3" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6c5dd3" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6c5dd3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points and labels */}
        {points.map((p, i) => {
          const shortMonth = p.label.split(' ')[0].substring(0, 3);
          return (
            <g key={i}>
              {/* Dot */}
              <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#6c5dd3" strokeWidth="2" />
              {/* Hover circle */}
              <circle cx={p.x} cy={p.y} r="6" fill="#6c5dd3" opacity="0.15" />
              {/* Amount tooltip */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#2d2d3a" fontSize="7.5" fontWeight="800">
                ₹{(p.totalSpent / 1000).toFixed(1)}k
              </text>
              {/* Month label */}
              <text x={p.x} y={height - 8} textAnchor="middle" fill="#8c8c99" fontSize="7.5" fontWeight="700">
                {shortMonth}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const periodOptions = [
    { value: 2, label: '2 Months' },
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '12 Months' },
    { value: 999, label: 'All Time' },
  ];

  return (
    <div className="animate-fade-in relative">
      <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-1">Financial Intelligence</p>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-[#2d2d3a] tracking-tight leading-none">Monthly<br />Performance</h1>
        <div className="flex gap-3 items-center">
          {monthLabel && (
            <div className="bg-white border border-[#f0f0f5] text-[#2d2d3a] px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              {monthLabel}
            </div>
          )}
        </div>
      </div>

      {/* ═══ SPENDING TREND LINE GRAPH ═══ */}
      <div className="bg-white border border-[#f0f0f5] p-8 rounded-3xl shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-extrabold text-[#2d2d3a] text-lg mb-1">Spending Trends</h3>
            <p className="text-xs text-[#8c8c99] font-medium">
              Monthly expense trend {trendData.length > 0 ? `(${trendData.length} month${trendData.length !== 1 ? 's' : ''} of data)` : ''}
            </p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-1.5">
            {periodOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTrendMonths(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  trendMonths === opt.value
                    ? 'bg-[#1a1a24] text-white shadow-md'
                    : 'bg-[#f7f7f9] text-[#8c8c99] hover:bg-[#e8e8ec] hover:text-[#2d2d3a]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {visibleTrend.length > 0 ? (
          <div className="h-[220px] w-full">
            {buildLineGraph()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-[#8c8c99] font-bold text-sm">
            {loadingTrend ? 'Loading trend data...' : 'Upload statements for multiple months to see spending trends.'}
          </div>
        )}
      </div>

      {/* ═══ CATEGORY BREAKDOWN + PIE CHART ═══ */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8 bg-white border border-[#f0f0f5] p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-extrabold text-[#2d2d3a] text-lg mb-1">Category Breakdown</h3>
              <p className="text-xs text-[#8c8c99] font-medium">Spending by category for {monthLabel || 'this period'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[#2d2d3a] font-bold text-xs bg-[#f7f7f9] px-3 py-1 rounded-full">
              ₹{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
            </div>
          </div>

          {topCategories.length > 0 ? (
            <div className="space-y-4">
              {topCategories.map(([cat, amount], idx) => {
                const pct = totalSpent > 0 ? (amount / totalSpent * 100) : 0;
                const color = categoryColorPalette[idx % categoryColorPalette.length];
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.fill }}></div>
                        <span className="text-sm font-bold text-[#2d2d3a]">{cat}</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#2d2d3a]">₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-2 w-full bg-[#f7f7f9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color.fill }}></div>
                    </div>
                    <p className="text-[0.6rem] font-bold text-[#8c8c99] mt-1 text-right">{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[#8c8c99] font-bold text-sm">
              No data available. Upload a statement to see breakdown.
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="col-span-4 bg-white border border-[#f0f0f5] p-8 rounded-3xl shadow-sm flex flex-col items-center">
          <div className="w-full text-left mb-6">
            <h3 className="font-extrabold text-[#2d2d3a] text-lg mb-1">Spending Split</h3>
            <p className="text-xs text-[#8c8c99] font-medium">Distribution for {monthLabel || 'this period'}</p>
          </div>
          <div className="flex flex-col items-center justify-center mb-5">
            <span className="text-2xl font-extrabold text-[#2d2d3a] tracking-tight">₹{(totalSpent / 1000).toFixed(1)}k</span>
            <span className="text-[0.55rem] font-bold text-[#8c8c99] tracking-widest uppercase">Total Expenses</span>
          </div>
          <div className="relative w-48 h-48 mb-8 flex-shrink-0">
            {pieData.length > 0 ? (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {buildPieSlices()}
                <circle cx="50" cy="50" r="22" fill="white" />
              </svg>
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="#f0f0f5" />
                <circle cx="50" cy="50" r="22" fill="white" />
              </svg>
            )}
          </div>
          <div className="w-full space-y-3">
            {pieData.slice(0, 4).map((slice, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color.fill }}></div>
                  <span className="text-[#5f5f6e] truncate max-w-[120px]">{slice.category}</span>
                </div>
                <span className="text-[#2d2d3a]">{slice.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TOP CATEGORIES + AI INSIGHT ═══ */}
      <div className="grid grid-cols-12 gap-6 pb-12">
        <div className="col-span-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-[#2d2d3a] text-lg">Top Spending Categories</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {top3.length > 0 ? top3.map(([cat, amount], idx) => {
              const color = categoryColorPalette[idx];
              const pct = totalSpent > 0 ? (amount / totalSpent * 100) : 0;
              const icon = categoryIcons[cat] || 'receipt_long';
              return (
                <div key={cat} className="bg-white p-5 rounded-2xl border border-[#f0f0f5] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: color.bg }}>
                      <span className="material-symbols-outlined" style={{ color: color.text }}>{icon}</span>
                    </div>
                    <span className="bg-[#f7f7f9] text-[#8c8c99] text-[0.65rem] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-1">{cat}</p>
                  <h4 className="text-xl font-extrabold text-[#2d2d3a]">₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                  <div className="w-full h-1 rounded-full mt-3" style={{ backgroundColor: color.bg }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: color.fill }}></div>
                  </div>
                </div>
              );
            }) : (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-[#f0f0f5] shadow-sm opacity-50">
                    <div className="w-10 h-10 bg-[#f7f7f9] rounded-[10px] mb-4"></div>
                    <p className="text-[0.65rem] font-bold text-[#8c8c99] mb-1">No Data</p>
                    <h4 className="text-xl font-extrabold text-[#8c8c99]">₹0</h4>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="col-span-4 mt-11">
          <div className="h-full bg-[#111e3b] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-[0_10px_30px_rgba(17,30,59,0.3)]">
            <div className="absolute top-4 right-4"><span className="material-symbols-outlined text-[#36d6a5] text-xl">temp_preferences_custom</span></div>
            <div>
              <h4 className="text-white font-extrabold mb-2">AI Optimization Insight</h4>
              <p className="text-[#899bbc] text-sm leading-relaxed mb-6 font-medium">
                {top3.length >= 2 ? (
                  <>Your top spending categories are <strong className="text-white">{top3[0][0]}</strong> and <strong className="text-white">{top3[1][0]}</strong>. Reducing them by 10% could save you <strong className="text-white">₹{((top3[0][1] + top3[1][1]) * 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> this month.</>
                ) : (
                  <>Upload a statement to get AI-powered optimization insights for your spending patterns.</>
                )}
              </p>
            </div>
            <button className="text-[#36d6a5] text-xs font-bold uppercase tracking-wider text-left hover:underline">Optimize Now →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
