import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Activity, Navigation, Loader2, Map as LucideMap, 
  AlertTriangle, Users, Timer, CloudSun 
} from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  // 顏色配置：手機版採用滿版背景色，電腦版維持邊框樣式
  const colorMap = {
    a: 'bg-blue-600 border-white text-white md:bg-transparent md:border-blue-500 md:text-blue-400 md:bg-blue-500/5',
    b: 'bg-emerald-500 border-white text-white md:bg-transparent md:border-emerald-500 md:text-emerald-400 md:bg-emerald-500/5',
    c: 'bg-emerald-500 border-white text-white md:bg-transparent md:border-emerald-500 md:text-emerald-400 md:bg-emerald-500/5',
    d: 'bg-slate-700 border-white text-white md:bg-transparent md:border-purple-500 md:text-purple-400 md:bg-purple-500/5',
    e: 'bg-emerald-500 border-white text-white md:bg-transparent md:border-red-500 md:text-red-400 md:bg-red-500/5',
    f: 'bg-emerald-500 border-white text-white md:bg-transparent md:border-pink-500 md:text-pink-400 md:bg-pink-500/5',
    g: 'bg-emerald-500 border-white text-white md:bg-transparent md:border-orange-500 md:text-orange-400 md:bg-orange-500/5'
  };

  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    const fetchData = () => {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
          const filtered = results.data.filter(row => row.項目名稱 && row.項目名稱.trim() !== "");
          setData(filtered);
        },
        error: () => setError("資料同步失敗")
      });
    };

    fetchData();
    const dTimer = setInterval(fetchData, 30000);
    const cTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    const setupMap = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
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
  const caseNameValue = findValue("案件名稱");
  const commanderValue = findValue("指揮官");

  const cardItems = data.filter(item => 
    !["案件名稱", "指揮官"].includes(item.項目名稱) && 
    !item.項目名稱.includes("leafjet")
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-6 font-sans tracking-tight">
      
      {/* 響應式 Header：手機版置中，電腦版左右排列 */}
      <header className="mb-8 border-b border-slate-800 pb-6">
        {/* 1. 標題：手機版置中 */}
        <div className="flex justify-center mb-6">
          <h1 className="text-4xl md:text-6xl font-black text-[#FF0000] flex items-center gap-4 italic">
            <Activity size={52} strokeWidth={3} className="animate-pulse" />
            戰情指揮看板
          </h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
          <div className="space-y-2 text-center md:text-left">
            {/* 案件名稱內容 */}
            <div className="text-[32px] md:text-[40px] text-[#FF0000] font-black leading-tight">
              {caseNameValue}
            </div>
            {/* 指揮官 */}
            <div className="text-[28px] md:text-[32px] text-[#FF0000] font-medium">
              指揮官：{commanderValue}
            </div>
          </div>

          {/* 3. 時間區域：手機版置中 */}
          <div className="text-center md:text-right">
            <div className="text-[44px] md:text-[52px] font-mono text-emerald-400 font-bold leading-none">
              {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
            </div>
            <div className="text-slate-500 text-lg md:text-xl mt-2 font-medium italic">
              {currentTime.toLocaleDateString('zh-TW')} | 系統穩定運作中
            </div>
          </div>
        </div>
      </header>

      {/* 數據卡片區域：手機版單欄/滿版色塊，電腦版多欄/透明樣式 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {cardItems.map((item, index) => {
          const styleClass = colorMap[item.編號] || 'bg-slate-800 md:bg-slate-900/50 border-slate-700';
          
          return (
            <div 
              key={index} 
              className={`p-5 rounded-2xl border-2 md:border-0 md:border-l-[10px] shadow-2xl flex flex-col items-center md:items-start justify-center text-center md:text-left ${styleClass}`}
            >
              <div className="text-white md:text-slate-400 text-sm md:text-xs font-bold uppercase tracking-widest mb-2 opacity-90 md:opacity-70">
                {item.項目名稱}
              </div>
              <div className="text-3xl md:text-5xl font-black tracking-tighter">
                {item.內容}
              </div>
            </div>
          );
        })}
      </div>

      {/* 地圖區域 */}
      <section className="space-y-4">
        <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 h-[350px] md:h-[600px] relative shadow-2xl">
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20">
              <Loader2 className="animate-spin text-red-500 mb-4" size={40} />
              <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">System Initializing...</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full z-10 grayscale-[0.2] contrast-[1.1]" />
        </div>
      </section>

      <footer className="mt-12 text-center text-slate-700 text-[9px] font-mono uppercase tracking-[0.5em]">
        Rescue Command System v2.0 | Operational Data Stable
      </footer>
    </div>
  );
};

export default App;
