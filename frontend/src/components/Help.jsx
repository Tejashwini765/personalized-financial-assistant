import React from 'react';

export default function Help() {
  const faqs = [
    {
      q: "How does the AI categorize my transactions?",
      a: "Our machine learning model analyzes the transaction descriptions and applies natural language processing to predict the category. It learns and improves whenever you manually correct a category!"
    },
    {
      q: "Is my financial data secure?",
      a: "Absolutely. All statements are processed entirely locally or passed selectively to the AI engine without being exposed to any third-party marketing services."
    },
    {
      q: "How do I upload new bank statements?",
      a: "Navigate to the Upload tab, select a .csv file exported from your bank, and click upload. The AI will instantly ingest and categorize every row."
    },
    {
      q: "Can I export my Monthly Performance reports?",
      a: "Currently, this is a planned feature! We will soon roll out PDF export capabilities directly from the Analysis dashboard."
    }
  ];

  return (
    <div className="animate-fade-in relative pb-10">
      {/* Blurred glow */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#6C63FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F3F4F6] mb-8">
        <p className="text-[0.7rem] font-bold text-[#6B7280] tracking-widest uppercase mb-4">Support Center</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1F2937] tracking-tight mb-4">How can we help?</h2>
        <p className="text-[#6B7280] max-w-xl text-sm leading-relaxed font-medium mb-8">
          Welcome to the finAI support center. Below are some frequently asked questions. If you need further assistance, our chatbot is equipped to handle detailed data queries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Support Card */}
          <div className="bg-[#EEF0FF] p-8 rounded-2xl border border-[#E5E7EB] transition-transform hover:-translate-y-1 duration-300">
             <div className="w-12 h-12 rounded-full bg-white text-[#6C63FF] flex items-center justify-center shadow-sm mb-5">
               <span className="material-symbols-outlined text-[20px]">support_agent</span>
             </div>
             <h3 className="text-xl font-extrabold text-[#1F2937] mb-2">Live Support</h3>
             <p className="text-sm text-[#6B7280] font-medium mb-6">Connect with a human advisor for any technical issues regarding your statements.</p>
             <button className="bg-white text-[#6C63FF] text-[0.85rem] font-bold py-3 px-6 rounded-xl hover:bg-[#6C63FF] hover:text-white transition-all shadow-sm">
               Contact Us
             </button>
          </div>

          {/* Documentation Card */}
          <div className="bg-gradient-to-br from-[#F5F6FF] to-white p-8 rounded-2xl border border-[#EEF0FF] transition-transform hover:-translate-y-1 duration-300">
             <div className="w-12 h-12 rounded-full bg-[#EEF0FF] text-[#6C63FF] flex items-center justify-center mb-5">
               <span className="material-symbols-outlined text-[20px]">menu_book</span>
             </div>
             <h3 className="text-xl font-extrabold text-[#1F2937] mb-2">Documentation</h3>
             <p className="text-sm text-[#6B7280] font-medium mb-6">Read about how our neural networks process and categorize your unstructured financial data.</p>
             <button className="bg-[#6C63FF] text-white text-[0.85rem] font-bold py-3 px-6 rounded-xl hover:bg-[#5b54e5] transition-all shadow-sm">
               Read Docs
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F3F4F6]">
         <h3 className="text-2xl font-extrabold text-[#1F2937] mb-8">Frequently Asked Questions</h3>
         <div className="space-y-4">
           {faqs.map((faq, idx) => (
             <div key={idx} className="p-6 rounded-2xl border border-[#EEF0FF] bg-gradient-to-br from-white to-[#F9FAFB] hover:shadow-[0_4px_12px_rgba(108,99,255,0.03)] transition-shadow">
                <h4 className="font-bold text-[#1F2937] mb-2 text-[0.95rem]">{faq.q}</h4>
                <p className="text-[0.85rem] text-[#6B7280] leading-relaxed font-medium">{faq.a}</p>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
