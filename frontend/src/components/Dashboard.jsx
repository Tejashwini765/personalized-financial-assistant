import React, { useState, useEffect } from 'react';

export default function Dashboard({ data, email, activeMonth, onNavigateToChatbot }) {
  const [insights, setInsights] = useState({ insights: [], recommendation: '' });
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (email) {
      fetchInsights();
    }
  }, [email, activeMonth, data]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const monthParam = activeMonth ? `&month=${encodeURIComponent(activeMonth)}` : '';
      const res = await fetch(`http://localhost:8000/api/insights?email=${encodeURIComponent(email)}${monthParam}`);
      if (res.ok) {
        const result = await res.json();
        setInsights(result);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
    setLoadingInsights(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Month Indicator */}
      {data?.monthLabel && data.monthLabel !== 'No Data' && (
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[#6c5dd3] text-[18px]">calendar_month</span>
          <p className="text-sm font-bold text-[#6c5dd3]">{data.monthLabel}</p>
        </div>
      )}

      {/* Top Section — Three Metrics */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Total Amount */}
        <div className="bg-[#f8f5fd] p-6 rounded-[20px] shadow-sm border border-[#ece8f8]">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3">Total Amount</p>
          <h3 className="text-2xl font-extrabold text-[#2d2d3a] mb-1">
            ₹{data?.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </h3>
          <p className="text-xs text-[#6c5dd3] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
            Estimated Budget
          </p>
        </div>

        {/* Amount Spent */}
        <div className="bg-[#fff0f4] p-6 rounded-[20px] shadow-sm border border-[#fce4eb]">
          <p className="text-[0.65rem] font-bold text-[#a39498] tracking-widest uppercase mb-3">Amount Spent</p>
          <h3 className="text-2xl font-extrabold text-[#2d2d3a] mb-1">
            ₹{data?.totalSpent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </h3>
          <p className="text-xs text-[#ff3b69] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Monthly Expenses
          </p>
        </div>

        {/* Savings */}
        <div className="bg-[#e5fcf4] p-6 rounded-[20px] shadow-sm border border-[#c8f5e3]">
          <p className="text-[0.65rem] font-bold text-[#5a9e83] tracking-widest uppercase mb-3">Savings</p>
          <h3 className="text-2xl font-extrabold text-[#2d2d3a] mb-1">
            ₹{data?.savings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </h3>
          <p className="text-xs text-[#00a86b] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">savings</span>
            Amount Saved
          </p>
        </div>
      </div>

      {/* Summary Text */}
      <div className="mb-8">
        <p className="text-[#5f5f6e] max-w-lg text-sm leading-relaxed font-medium">
          {data?.monthLabel && data.monthLabel !== 'No Data' 
            ? <>Here's your <strong className="text-[#2d2d3a]">{data.monthLabel}</strong> financial summary. <strong className="text-[#2d2d3a]">finAI</strong> analyzed your statement and found these insights.</>
            : <>Welcome back. Upload a bank statement and let <strong className="text-[#2d2d3a]">finAI</strong> analyze your spending.</>
          }
        </p>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#f0f0f5] p-5 rounded-[20px] shadow-sm">
          <p className="text-[0.65rem] font-bold text-[#a39498] tracking-widest uppercase mb-3">Top Category</p>
          <h3 className="text-xl font-extrabold text-[#2d2d3a] mb-1">{data?.topCategory || 'N/A'}</h3>
          <p className="text-xs text-[#a39498] font-medium">Largest spend sector</p>
        </div>
        <div className="bg-white border border-[#f0f0f5] p-5 rounded-[20px] shadow-sm">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3">Avg Transaction Amount</p>
          <h3 className="text-xl font-extrabold text-[#2d2d3a] mb-3">
            ₹{data?.transactions?.length ? (data.totalSpent / data.transactions.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
          </h3>
          <div className="h-1.5 w-full bg-[#f0f0f5] rounded-full overflow-hidden">
            <div className="h-full bg-[#2d2d3a] w-[70%]"></div>
          </div>
        </div>
        <div className="bg-white border border-[#f0f0f5] p-5 rounded-[20px] shadow-sm">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3">Transactions</p>
          <h3 className="text-xl font-extrabold text-[#2d2d3a] mb-1">{data?.transactions?.length || 0} Records</h3>
          <p className="text-xs text-[#8c8c99] font-medium">This month's statements</p>
        </div>
      </div>

      {/* AI Financial Insights — REAL AI */}
      <div className="bg-[#f8f5fd] rounded-[24px] p-8 mb-10 flex gap-10 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#6c5dd3]">auto_awesome</span>
            <h3 className="font-extrabold text-[#2d2d3a]">AI Financial Insights</h3>
            {loadingInsights && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1.5 h-1.5 bg-[#6c5dd3] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#6c5dd3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-[#6c5dd3] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
          {insights.insights && insights.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5f5f6e] mt-2"></div>
              <p className="text-[#2d2d3a] text-sm font-medium">{insight}</p>
            </div>
          ))}
          {insights.recommendation && (
            <div className="flex items-start gap-3 pt-2">
              <div className="w-2 h-2 rounded-full bg-[#00a86b] mt-1.5"></div>
              <p className="text-[#2d2d3a] text-sm font-bold">
                Recommendation: <span className="text-[#00a86b]">{insights.recommendation}</span>
              </p>
            </div>
          )}
        </div>

        {/* Quick Tip — linked to Chatbot */}
        <div className="w-[280px] bg-white p-5 rounded-2xl shadow-sm border border-[#f0f0f5]">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-2">Quick Tip</p>
          <p className="text-[0.8rem] text-[#5f5f6e] font-medium leading-relaxed mb-4">
            Have questions about your spending? Let <strong className="text-[#2d2d3a] font-extrabold">finAI</strong> analyze your transactions and provide personalized advice.
          </p>
          <button 
            onClick={() => onNavigateToChatbot && onNavigateToChatbot()}
            className="text-xs font-bold text-[#2d2d3a] flex items-center gap-1 hover:text-[#6c5dd3] transition-colors"
          >
            Ask finAI to handle this
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
