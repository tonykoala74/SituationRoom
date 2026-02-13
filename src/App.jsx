import React, { useState, useEffect, useRef } from 'react';
import { Activity, Navigation, Loader2 } from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  const colorSequence = [
    'bg-blue-600 border-blue-400', 'bg-emerald-600 border-emerald-400', 
    'bg-cyan-600 border-cyan-300', 'bg-pink-700 border-pink-500', 
    'bg-purple-600 border-teal-400', 'bg-zinc-500 border-teal-300', 
    'bg-orange-600 border-orange-400', 'bg-yellow-500 border-teal-300', 
    'bg-lime-500 border-teal-300', 'bg-violet-500 border-teal-300'
  ];

  const getCardStyle = (code) => {
    if (!code) return 'bg-slate-800 border-slate-600';
    const charCode = String(code).toLowerCase().charCodeAt(0);
    const index = (charCode - 'a'.charCodeAt(0)) % colorSequence.length;
    return colorSequence[index] || 'bg-slate-800 border-slate-600';
  };

  // 核心改動：使用 fetch 抓取 GAS JSON 資料
  const fetchData = async () => {
    try {
      const gasUrl = import.meta.env.VITE_SHEET_URL;
      // 加上時間戳記強迫繞過任何可能的瀏覽器快取
      const response = await fetch(`${gasUrl}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error("網路回應不正常");
      const result = await response.json();
      
      const filtered = result.filter(row => row.項目名稱 && String(row.項目名稱).trim() !== "");
      setData(filtered);
      setError(null);
    } catch (err) {
      console.error("同步失敗:", err);
      setError("連線異常");
    }
  };

  useEffect(() => {
    fetchData();
    // 設定 10 秒自動刷新，確保戰情即時
    const dTimer = setInterval(fetchData, 10000);
    const cTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    const setupMap = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const l = document.createElement('link'); l.rel = 'stylesheet';
        l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(l);
      }
      if (!window.L) {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => setMapLoaded(true);
        document.head.appendChild(s);
      } else { setMapLoaded(true); }
    };
    setupMap();
    return () => { clearInterval(dTimer); clearInterval(cTimer); };
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && !leafletInstance.current) {
      const L = window.L;
      const map = L.map(mapRef.current).setView([23.9738, 120.9820], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([23.9738, 120.9820]).addTo(map).bindPopup('前進指揮所 (ICP)').openPopup();
      leafletInstance.current = map;
    }
  }, [mapLoaded]);

  const findValue = (name) => data.find(item => item.項目名稱 === name)?.內容 || "---";

  return (
    <div className="min-h-screen bg-black text-slate-200 p-4 lg:p-6 font-sans tracking-tight">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex justify-center mb-6">
          <h1 className="text-4xl md:text-6xl font-black text-[#FF0000] flex items-center gap-4 italic">
            <Activity size={52} strokeWidth={3} className="animate-pulse" />
            戰情指揮看板
          </h1>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
          <div className="space-y-2">
            <div className="text-[32px] md:text-[40px] text-[#FF0000] font-black leading-tight">
              {findValue("案件名稱")}
            </div>
            <div className="text-[28px] md:text-[32px] text-[#FF0000] font-medium">
              指揮官：{findValue("指揮官")}
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-[44px] md:text-[52px] font-mono text-emerald-400 font-bold leading-none">
              {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
            </div>
            <div className={`text-lg md:text-xl mt-2 font-medium italic ${error ? 'text-red-500 animate-bounce' : 'text-slate-500'}`}>
              {error ? `⚠️ ${error}` : '系統穩定運作中'}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {data.filter(item => !["案件名稱", "指揮官"].includes(item.項目名稱) && !item.項目名稱.includes("leafjet")).map((item, index) => (
          <div key={index} className={`p-6 rounded-2xl border-2 shadow-xl flex flex-col items-center justify-center text-center text-white transition-all hover:scale-[1.02] ${getCardStyle(item.編號)}`}>
            <div className="text-sm md:text-base font-bold uppercase tracking-widest mb-2 opacity-90">{item.項目名稱}</div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter">{item.內容}</div>
          </div>
        ))}
      </div>

      <section className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 h-[350px] md:h-[600px] relative shadow-2xl">
        <div ref={mapRef} className="w-full h-full z-10 grayscale-[0.2] contrast-[1.1]" />
      </section>
    </div>
  );
};

export default App;
