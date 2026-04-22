import React, { useState } from 'react';

export default function History({ transactions = [], unreviewed = {}, onCorrect, monthLabel = '' }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Get unique categories from transactions
  const categories = [...new Set(transactions.map(tx => tx['Final Category']).filter(Boolean))];

  // Filter transactions by selected category
  const filteredTransactions = transactions.filter(tx => {
    const categoryMatch = selectedCategory === 'All' || tx['Final Category'] === selectedCategory;
    
    // Date filtering
    let dateMatch = true;
    if (dateFrom) {
      const txDate = new Date(tx.date);
      const fromDate = new Date(dateFrom);
      if (txDate < fromDate) dateMatch = false;
    }
    if (dateTo) {
      const txDate = new Date(tx.date);
      const toDate = new Date(dateTo);
      if (txDate > toDate) dateMatch = false;
    }
    
    return categoryMatch && dateMatch;
  });

  // Color mapping for categories
  const categoryColors = {
    'Utilities': { bg: '#eff9ff', text: '#007edc', dot: '#007edc', hoverBg: '#e4f4ff' },
    'Dining': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Food': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Food & Dining': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Shopping': { bg: '#fff4e5', text: '#ff8c00', dot: '#ff8c00', hoverBg: '#ffeccd' },
    'Travel': { bg: '#f8f5fd', text: '#6c5dd3', dot: '#6c5dd3', hoverBg: '#f0ebfc' },
    'Health': { bg: '#fff0f4', text: '#ff3b69', dot: '#ff3b69', hoverBg: '#ffe5ec' },
    'Entertainment': { bg: '#f8f5fd', text: '#6c5dd3', dot: '#6c5dd3', hoverBg: '#f0ebfc' },
    'Transport': { bg: '#eff9ff', text: '#007edc', dot: '#007edc', hoverBg: '#e4f4ff' },
    'Groceries': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Fuel': { bg: '#fff4e5', text: '#ff8c00', dot: '#ff8c00', hoverBg: '#ffeccd' },
    'Rent': { bg: '#f8f5fd', text: '#6c5dd3', dot: '#6c5dd3', hoverBg: '#f0ebfc' },
    'Income': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Transfer': { bg: '#eff9ff', text: '#007edc', dot: '#007edc', hoverBg: '#e4f4ff' },
    'Insurance': { bg: '#fff0f4', text: '#ff3b69', dot: '#ff3b69', hoverBg: '#ffe5ec' },
    'Investment': { bg: '#e5fcf4', text: '#00a86b', dot: '#00a86b', hoverBg: '#d5faec' },
    'Education': { bg: '#eff9ff', text: '#007edc', dot: '#007edc', hoverBg: '#e4f4ff' },
  };

  const getColorForCategory = (cat) => categoryColors[cat] || { bg: '#f7f7f9', text: '#5f5f6e', dot: '#5f5f6e', hoverBg: '#f0f0f5' };

  return (
    <div className="animate-fade-in relative max-w-full">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight">Transactional History</h1>
      </div>
      {monthLabel && (
        <div className="flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-[#6c5dd3] text-[16px]">calendar_month</span>
          <p className="text-sm font-bold text-[#6c5dd3]">{monthLabel}</p>
        </div>
      )}

      <div className="flex gap-6 mb-10 overflow-x-auto pb-2">
        {/* Calendar Date Picker */}
        <div className="min-w-[260px]">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span> Timeframe
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#f0f0f5]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[0.55rem] font-bold text-[#8c8c99] tracking-widest uppercase">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full font-bold text-[#2d2d3a] text-sm bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl px-3 py-2.5 outline-none focus:border-[#6c5dd3] transition-colors cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.55rem] font-bold text-[#8c8c99] tracking-widest uppercase">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full font-bold text-[#2d2d3a] text-sm bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl px-3 py-2.5 outline-none focus:border-[#6c5dd3] transition-colors cursor-pointer"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button 
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-[0.65rem] font-bold text-[#ff3b69] hover:text-[#d4234e] transition-colors self-end"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution — Clickable Filter */}
        <div className="flex-1">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">pie_chart</span> Category Distribution
          </p>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#f0f0f5] flex items-center gap-3 flex-wrap">
            <span
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2.5 rounded-[10px] text-xs font-bold shadow-sm cursor-pointer transition-all ${
                selectedCategory === 'All'
                  ? 'bg-[#1a1a24] text-white'
                  : 'bg-[#f7f7f9] text-[#5f5f6e] hover:bg-[#e8e8ec]'
              }`}
            >
              All History
            </span>
            {categories.map((cat) => {
              const color = getColorForCategory(cat);
              const isActive = selectedCategory === cat;
              return (
                <span
                  key={cat}
                  onClick={() => setSelectedCategory(isActive ? 'All' : cat)}
                  className={`px-4 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isActive
                      ? 'ring-2 ring-offset-1 shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                    ...(isActive ? { ringColor: color.text } : {})
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.dot }}></div>
                  {cat}
                  {isActive && (
                    <span className="material-symbols-outlined text-[12px] ml-0.5">close</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Filter Indicator */}
      {selectedCategory !== 'All' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-bold text-[#8c8c99]">Filtered by:</span>
          <span 
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: getColorForCategory(selectedCategory).bg,
              color: getColorForCategory(selectedCategory).text
            }}
          >
            {selectedCategory}
            <button onClick={() => setSelectedCategory('All')} className="hover:opacity-70">
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </span>
          <span className="text-xs text-[#8c8c99] font-medium">
            ({filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <p className="text-xs font-bold text-[#8c8c99] tracking-wider uppercase mb-4 border-b border-[#f0f0f5] pb-2">
            {selectedCategory === 'All' ? 'Recent Transactions' : `${selectedCategory} Transactions`}
          </p>
          <div className="space-y-2">
            {filteredTransactions.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-white rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-[#f0f0f5] hover:shadow-sm">
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 ${tx['Final Category'] === 'Dining' || tx['Final Category'] === 'Food' ? 'bg-[#e5fcf4] text-[#00a86b]' : tx['Final Category'] === 'Travel' ? 'bg-[#f8f5fd] text-[#6c5dd3]' : tx['Final Category'] === 'Shopping' ? 'bg-[#fff4e5] text-[#ff8c00]' : 'bg-[#eff9ff] text-[#007edc]'} rounded-[10px] flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {tx['Final Category'] === 'Dining' || tx['Final Category'] === 'Food' ? 'restaurant' : tx['Final Category'] === 'Travel' ? 'local_taxi' : tx['Final Category'] === 'Shopping' ? 'shopping_bag' : 'bolt'}
                    </span>
                  </div>
                  <div>
                    <p className="font-extrabold text-[#2d2d3a]">{tx.description}</p>
                    <p className="text-[0.65rem] font-bold text-[#8c8c99] mt-0.5">
                      {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-16">
                  <span className={`border ${tx['Final Category'] === 'Dining' || tx['Final Category'] === 'Food' ? 'border-[#e5fcf4] text-[#00a86b]' : tx['Final Category'] === 'Travel' ? 'border-[#f8f5fd] text-[#6c5dd3]' : tx['Final Category'] === 'Shopping' ? 'border-[#fff4e5] text-[#ff8c00]' : 'border-[#eff9ff] text-[#007edc]'} px-3 py-1 rounded-[6px] text-[0.65rem] font-extrabold uppercase tracking-wider`}>
                    {tx['Final Category']}
                  </span>
                  <div className="text-right w-24">
                    <p className="font-extrabold text-[#2d2d3a]">- ₹{parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-sm font-bold text-[#8c8c99] p-4 text-center">
                {selectedCategory === 'All' 
                  ? 'No transactions available. Please upload a statement.' 
                  : `No transactions found for "${selectedCategory}".`}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-8 pb-10 border-t border-[#f0f0f5] pt-6">
         <button className="text-xs font-bold text-[#8c8c99] flex items-center gap-2 hover:text-[#2d2d3a]"><span className="material-symbols-outlined text-[16px]">arrow_back</span> Previous</button>
         <div className="flex gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-[#2d2d3a] text-white rounded-full text-xs font-bold cursor-pointer shadow-md">1</span>
            <span className="w-8 h-8 flex items-center justify-center hover:bg-[#f0f0f5] text-[#8c8c99] rounded-full text-xs font-bold cursor-pointer transition-colors">2</span>
            <span className="w-8 h-8 flex items-center justify-center hover:bg-[#f0f0f5] text-[#8c8c99] rounded-full text-xs font-bold cursor-pointer transition-colors">3</span>
            <span className="w-8 h-8 flex items-center justify-center text-[#8c8c99] rounded-full text-xs font-bold">...</span>
            <span className="w-8 h-8 flex items-center justify-center hover:bg-[#f0f0f5] text-[#8c8c99] rounded-full text-xs font-bold cursor-pointer transition-colors">12</span>
         </div>
         <button className="text-xs font-bold text-[#8c8c99] flex items-center gap-2 hover:text-[#2d2d3a]">Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
      </div>
    </div>
  );
}
