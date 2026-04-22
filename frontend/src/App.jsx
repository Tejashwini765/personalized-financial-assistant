import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import History from './components/History';
import Chatbot from './components/Chatbot';
import Upload from './components/Upload';
import Help from './components/Help';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Backend State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    transactions: [], totalSpent: 0, totalAmount: 0, savings: 0,
    topCategory: 'N/A', categoryBreakdown: {},
    activeMonth: '', monthLabel: 'No Data'
  });
  const [unreviewedData, setUnreviewedData] = useState({ transactions: [], allCategories: [] });
  const [uploading, setUploading] = useState(false);
  
  // Monthly state
  const [availableMonths, setAvailableMonths] = useState([]);
  const [activeMonth, setActiveMonth] = useState('');

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    if (isLoggedIn) {
      fetchMonths();
    }
  }, [isLoggedIn]);

  // When activeMonth changes, re-fetch data
  useEffect(() => {
    if (isLoggedIn && activeMonth) {
      fetchDashboard(activeMonth);
      fetchUnreviewed(activeMonth);
    }
  }, [activeMonth]);

  const fetchMonths = async () => {
    try {
      const res = await fetch(`${API_URL}/months?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableMonths(data.months || []);
        if (data.activeMonth) {
          setActiveMonth(data.activeMonth);
        } else {
          // No data yet — still fetch to show empty state
          fetchDashboard('');
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return alert("Enter credentials");
    try {
      const res = await fetch(`${API_URL}${isRegistering ? '/register' : '/login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) setIsLoggedIn(true);
      else alert(data.detail || "Authentication error");
    } catch (err) {
      alert("Error connecting to backend API");
    }
  };

  const fetchDashboard = async (month = '') => {
    try {
      const monthParam = month ? `&month=${encodeURIComponent(month)}` : '';
      const res = await fetch(`${API_URL}/transactions?email=${encodeURIComponent(email)}${monthParam}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchUnreviewed = async (month = '') => {
    try {
      const monthParam = month ? `&month=${encodeURIComponent(month)}` : '';
      const res = await fetch(`${API_URL}/unreviewed?email=${encodeURIComponent(email)}${monthParam}`);
      if (res.ok) setUnreviewedData(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (file, selectedMonth) => {
    if (!file) return null;
    setUploading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);
    if (selectedMonth) formData.append('month', selectedMonth);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        // Switch to the uploaded month
        await fetchMonths();
        if (result.uploadMonth) {
          setActiveMonth(result.uploadMonth);
        }
        setUploading(false);
        return result;
      } else {
        const data = await res.json();
        alert("Upload failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Error connecting to server");
    }
    setUploading(false);
    return null;
  };

  const handleCorrect = async (txId, correctedCategory) => {
    try {
      const res = await fetch(`${API_URL}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, correctedCategory })
      });
      if (res.ok) {
        fetchDashboard(activeMonth);
        fetchUnreviewed(activeMonth);
      }
    } catch (err) {
      alert("Error updating transaction");
    }
  };

  const handleMonthChange = (month) => {
    setActiveMonth(month);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setDashboardData({
      transactions: [], totalSpent: 0, totalAmount: 0, savings: 0,
      topCategory: 'N/A', categoryBreakdown: {},
      activeMonth: '', monthLabel: 'No Data'
    });
    setUnreviewedData({ transactions: [], allCategories: [] });
    setAvailableMonths([]);
    setActiveMonth('');
    setActiveTab('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#fcfcfd] text-[#1a1a24] font-sans">
        <div className="bg-white border border-[#f0f0f5] rounded-3xl p-10 shadow-sm w-full max-w-md text-center">
          <div className="w-12 h-12 bg-[#48485e] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined">filter_vintage</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">finAI</h1>
          <p className="text-[#5f5f6e] mb-8 font-medium">
            {isRegistering ? "Create your private workspace" : "Login to your workspace"}
          </p>
          <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left">
            <input
              type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl text-sm font-bold text-[#2d2d3a] focus:border-[#00a86b] outline-none w-full transition-colors" required
            />
            <input
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl text-sm font-bold text-[#2d2d3a] focus:border-[#00a86b] outline-none w-full transition-colors" required
            />
            <button type="submit" className="mt-2 bg-[#1a1a24] text-white py-3.5 rounded-xl font-bold shadow-[0_8px_20px_rgba(26,26,36,0.15)] hover:-translate-y-0.5 transition-transform text-sm">
              {isRegistering ? "Create Account" : "Access Dashboard"}
            </button>
          </form>
          <div className="mt-8 text-xs font-bold text-[#8c8c99]">
            <button className="hover:text-[#2d2d3a] transition-colors" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? "Already have an account? Login" : "No account yet? Register Here"}
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex bg-[#fcfcfd] min-h-screen text-[#1a1a24] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#f0f0f5] flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#48485e] rounded-full flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-sm">filter_vintage</span>
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-[#2d2d3a]">finAI</h1>
            <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase">Assistant</p>
          </div>
        </div>

        {/* Month Selector */}
        {availableMonths.length > 0 && (
          <div className="mb-6">
            <p className="text-[0.55rem] font-bold text-[#8c8c99] tracking-widest uppercase mb-2">Statement Period</p>
            <select
              value={activeMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-[#f7f7f9] border border-[#f0f0f5] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2d3a] outline-none focus:border-[#6c5dd3] cursor-pointer transition-colors"
            >
              {availableMonths.map((m) => {
                const [y, mo] = m.split('-');
                const label = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>
        )}

        <nav className="flex flex-col gap-2 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-[#e5fcf4] text-[#1a1a24]' : 'text-[#5f5f6e] hover:bg-[#f7f7f9]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'upload' ? 'bg-[#e5fcf4] text-[#1a1a24]' : 'text-[#5f5f6e] hover:bg-[#f7f7f9]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Upload
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'analysis' ? 'bg-[#e5fcf4] text-[#1a1a24]' : 'text-[#5f5f6e] hover:bg-[#f7f7f9]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            Analysis
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-[#e5fcf4] text-[#1a1a24]' : 'text-[#5f5f6e] hover:bg-[#f7f7f9]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            History
          </button>

          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'chatbot' ? 'bg-[#e5fcf4] text-[#1a1a24]' : 'text-[#5f5f6e] hover:bg-[#f7f7f9]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            Chatbot
          </button>
        </nav>

        <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-[#F3F4F6]">
          <button 
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === 'help' ? 'bg-[#EEF0FF] text-[#6C63FF]' : 'text-[#6B7280] hover:bg-[#F8F9FF] hover:text-[#6C63FF]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            Help
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[#6B7280] hover:bg-[#F8F9FF] hover:text-[#EF4444] transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-12 py-8 max-w-[1100px] mx-auto">
        {activeTab === 'dashboard' && <Dashboard data={dashboardData} email={email} activeMonth={activeMonth} onNavigateToChatbot={() => setActiveTab('chatbot')} />}
        {activeTab === 'upload' && <Upload onUpload={handleUpload} uploading={uploading} email={email} onCorrect={handleCorrect} activeMonth={activeMonth} />}
        {activeTab === 'analysis' && <Analysis breakdown={dashboardData.categoryBreakdown} totalSpent={dashboardData.totalSpent} monthLabel={dashboardData.monthLabel} email={email} activeMonth={activeMonth} />}
        {activeTab === 'history' && <History transactions={dashboardData.transactions} unreviewed={unreviewedData} onCorrect={handleCorrect} monthLabel={dashboardData.monthLabel} />}
        {activeTab === 'chatbot' && <Chatbot email={email} activeMonth={activeMonth} />}
        {activeTab === 'help' && <Help />}
      </main>
    </div>
  );
}

export default App;
