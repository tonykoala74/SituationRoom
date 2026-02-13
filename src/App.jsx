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

  // 定義顏色映射表，確保同編號（a, b, c...）呈現相同顏色
  const colorMap = {
    a: 'border-blue-500 text-blue-400 bg-blue-500/5',
    b: 'border-emerald-500 text-emerald-400 bg-emerald-500/5',
    c: 'border-amber-500 text-amber-400 bg-amber-500/5',
    d: 'border-purple-500 text-purple-400 bg-purple-500/5',
    e: 'border-red-500 text-red-400 bg-red-500/5',
    f: 'border-pink-500 text-pink-400 bg-pink-500/5',
    g: 'border-orange-500 text-orange-400 bg-orange-500/5'
  };

  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    const fetchData = () => {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
          // 過濾掉試算表中的空行
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
      // 預設中心點設定為南投山區座標
      const map = L.map(mapRef.current).setView([23.9738, 120.9820], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([23.9738, 120.9820]).addTo(map).bindPopup('前進指揮所 (ICP)').openPopup();
      leafletInstance.current = map;
    }
  }, [mapLoaded]);

  // 輔助函式：從試算表中尋找內容
  const findValue = (name) => data.find(item => item.項目名稱 === name)?.內容 || "---";

  const caseName = findValue("案件名稱");
  const commander = findValue("指揮官");

  // 過濾掉標題項目，剩下的轉為卡片，地圖除外
  const cardItems = data.filter(item => 
    !["案件名稱", "指揮官"].includes(item.項目名稱) && 
    !item.項目名稱.includes("leafjet")
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-6 font-sans tracking-tight">
      {/* Header - 戰情室風格標題 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-1">{caseName}</h2>
          <h1 className="text-3xl md:text-4xl font-black text-red-500 flex items-center gap-3">
            <Activity size={36} strokeWidth={3} className="animate-pulse" />
            指揮官：{commander}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-emerald-400 font-bold leading-none">
            {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
          </div>
          <div className="text-slate-500 text-xs mt-1 font-medium italic">
            {currentTime.toLocaleDateString('zh-TW')} | 系統穩定運作中
          </div>
        </div>
      </header>

      {/* 數據卡片區域 - 在手機上為一列兩格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {cardItems.map((item, index) => {
          const styleClass = colorMap[item.編號] || 'border-slate-700 bg-slate-900/50';
          return (
            <div 
              key={index} 
              className={`p-5 rounded-2xl border-l-[10px] shadow-2xl transition-all hover:brightness-125 ${styleClass}`}
            >
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 opacity-70">
                {item.項目名稱}
              </div>
              <div className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                {item.內容}
              </div>
            </div>
          );
        })}
      </div>

      {/* 地圖區域 - 移至最下方 */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-bold text-xs uppercase tracking-[0.4em]">Geospatial Intelligence</span>
          <div className="h-[1px] flex-1 bg-slate-800"></div>
        </div>
        <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 h-[400px] md:h-[600px] relative">
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
        Rescue Command System v2.0 | Confidential Data Access
      </footer>
    </div>
  );
};

export default App;
