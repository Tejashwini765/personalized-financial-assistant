import React, { useState, useEffect } from 'react';

export default function Upload({ onUpload, uploading, email, onCorrect, activeMonth }) {
  const [file, setFile] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [queries, setQueries] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [corrections, setCorrections] = useState({});

  // Month/Year selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  // Generate years from 2020 to current+1
  const years = [];
  for (let y = currentDate.getFullYear() + 1; y >= 2020; y--) {
    years.push(String(y));
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadDone(false);
      setUploadResult(null);
      setQueries([]);
    }
  };

  const handleUploadAndFetch = async () => {
    if (!file) return;
    const monthStr = `${selectedYear}-${selectedMonth}`;
    const result = await onUpload(file, monthStr);
    setUploadDone(true);
    if (result) setUploadResult(result);
    // Reset file so user can upload another
    setFile(null);
    // Fetch AI queries for unclear transactions
    fetchQueries();
  };

  const fetchQueries = async () => {
    try {
      const monthParam = activeMonth ? `&month=${encodeURIComponent(activeMonth)}` : '';
      const res = await fetch(`http://localhost:8000/api/upload-queries?email=${encodeURIComponent(email)}${monthParam}`);
      if (res.ok) {
        const data = await res.json();
        setQueries(data.queries || []);
        setAllCategories(data.allCategories || []);
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  };

  const handleCategorySelect = (txId, category) => {
    setCorrections(prev => ({ ...prev, [txId]: category }));
  };

  const handleSubmitCorrection = async (txId) => {
    const correctedCategory = corrections[txId];
    if (!correctedCategory) return;
    
    if (onCorrect) {
      await onCorrect(txId, correctedCategory);
    }
    setQueries(prev => prev.filter(q => q.id !== txId));
    setCorrections(prev => {
      const next = { ...prev };
      delete next[txId];
      return next;
    });
  };

  return (
    <div className="animate-fade-in flex flex-col items-center justify-start min-h-[calc(100vh-150px)] py-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#e5fcf4] rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-sm transform -rotate-6">
            <span className="material-symbols-outlined text-[#00a86b] text-[32px] rotate-6">upload_file</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight mb-2">Upload Statement</h2>
          <p className="text-[#8c8c99] text-sm font-medium">Select the month & year, then upload your CSV file to categorize transactions.</p>
        </div>

        {/* Month & Year Selector */}
        <div className="bg-white border border-[#f0f0f5] rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            Statement Period
          </p>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d2d3a] outline-none focus:border-[#6c5dd3] cursor-pointer transition-colors"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-[120px] bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl px-4 py-3 text-sm font-bold text-[#2d2d3a] outline-none focus:border-[#6c5dd3] cursor-pointer transition-colors"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File Drop Zone */}
        <div className={`bg-white border-2 border-dashed ${file ? 'border-[#00a86b] bg-[#e5fcf4]' : 'border-[#dcdce5]'} rounded-[24px] p-12 text-center hover:bg-[#f7f7f9] hover:border-[#6c5dd3] transition-all cursor-pointer group shadow-sm mb-6 relative overflow-hidden`}>
          <span className={`material-symbols-outlined text-4xl mb-4 transition-all block ${file ? 'text-[#00a86b]' : 'text-[#c4c4cc] group-hover:text-[#6c5dd3] group-hover:-translate-y-2'}`}>
            {file ? 'task' : 'cloud_upload'}
          </span>
          <p className="font-extrabold text-[#2d2d3a] mb-1">{file ? file.name : "Click to browse or drag file here"}</p>
          <p className="text-xs text-[#8c8c99] font-medium">{file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV, XLS, XLSX (Max 10MB)"}</p>
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
        </div>

        <button 
          disabled={!file || uploading} 
          onClick={handleUploadAndFetch}
          className="w-full bg-[#1a1a24] disabled:bg-[#a39498] text-white py-3.5 rounded-[12px] font-bold text-sm shadow-[0_8px_20px_rgba(26,26,36,0.15)] transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0">
          {uploading ? "Processing..." : `Classify Records for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
        </button>
      </div>

      {/* Upload Result */}
      {uploadDone && uploadResult && (
        <div className="max-w-xl w-full mt-6 mb-4">
          <div className="bg-[#e5fcf4] rounded-[16px] p-4 border border-[#c8f5e3] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00a86b] text-[24px]">check_circle</span>
            <div>
              <p className="font-bold text-[#2d2d3a] text-sm">Statement processed for <span className="text-[#6c5dd3]">{uploadResult.monthLabel}</span></p>
              <p className="text-xs text-[#5a9e83] font-medium">{uploadResult.recordCount} transactions categorized by AI</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Questions Section */}
      {uploadDone && queries.length > 0 && (
        <div className="max-w-2xl w-full mt-6">
          <div className="bg-[#f8f5fd] rounded-[24px] p-6 border border-[#ece8f8]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[#6c5dd3]">psychology</span>
              </div>
              <div>
                <h3 className="font-extrabold text-[#2d2d3a] text-lg">AI Needs Your Help</h3>
                <p className="text-xs text-[#8c8c99] font-medium">
                  The model is uncertain about {queries.length} transaction{queries.length !== 1 ? 's' : ''}. Please clarify the category.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {queries.map((q) => (
                <div key={q.id} className="bg-white rounded-2xl p-5 border border-[#f0f0f5] shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[#ff8c00] text-[18px]">help_outline</span>
                        <p className="font-extrabold text-[#2d2d3a] text-sm">
                          What category does "{q.description}" belong to?
                        </p>
                      </div>
                      <p className="text-xs text-[#8c8c99] font-medium ml-6">
                        Amount: ₹{q.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {q.date && ` • ${q.date}`}
                        {q.predictedCategory && (
                          <span className="ml-2">
                            — AI predicted: <span className="text-[#6c5dd3] font-bold">{q.predictedCategory}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap ml-6">
                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(q.id, cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          corrections[q.id] === cat
                            ? 'bg-[#1a1a24] text-white shadow-md'
                            : q.predictedCategory === cat
                            ? 'bg-[#e5fcf4] text-[#00a86b] border border-[#c8f5e3]'
                            : 'bg-[#f7f7f9] text-[#5f5f6e] hover:bg-[#e8e8ec]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {corrections[q.id] && (
                      <button
                        onClick={() => handleSubmitCorrection(q.id)}
                        className="ml-2 px-4 py-1.5 bg-[#00a86b] text-white rounded-lg text-xs font-bold hover:-translate-y-0.5 transition-transform shadow-sm"
                      >
                        Confirm ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {queries.length > 0 && (
              <p className="text-xs text-[#8c8c99] font-medium mt-4 text-center">
                Your corrections help the AI model learn and improve future predictions.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success state when no queries remain */}
      {uploadDone && queries.length === 0 && (
        <div className="max-w-xl w-full mt-8">
          <div className="bg-[#e5fcf4] rounded-[20px] p-6 text-center border border-[#c8f5e3]">
            <span className="material-symbols-outlined text-[#00a86b] text-[36px] mb-2">check_circle</span>
            <h3 className="font-extrabold text-[#2d2d3a] mb-1">All Transactions Classified!</h3>
            <p className="text-xs text-[#5a9e83] font-medium">The AI model was confident about all your transactions. Head to the Dashboard to see your insights.</p>
          </div>
        </div>
      )}
    </div>
  );
}
