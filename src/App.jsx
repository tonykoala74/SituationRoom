import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Activity, Navigation, Loader2, Map as LucideMap 
} from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  // 根據編號映射顏色，並調整為滿版色塊風格
  const colorMap = {
    a: 'bg-blue-600 border-blue-400 text-white',
    b: 'bg-emerald-600 border-emerald-400 text-white',
    c: 'bg-emerald-500 border-emerald-300 text-white',
    d: 'bg-slate-700 border-slate-500 text-white',
    e: 'bg-teal-600 border-teal-400 text-white',
    f: 'bg-teal-500 border-teal-300 text-white',
    g: 'bg-orange-600 border-orange-400 text-white'
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

  // 過濾掉標題項目與地圖
  const cardItems = data.filter(item => 
    !["案件名稱", "指揮官"].includes(item.項目名稱) && 
    !item.項目名稱.includes("leafjet")
  );

  return (
    <div className="min-h-screen bg-black text-slate-200 p-3 lg:p-6 font-sans tracking-tight">
      
      {/* Header：完全比照新手機介面 */}
      <header className="mb-6 flex flex-col items-center border-b border-slate-800 pb-4">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Activity size={40} className="text-[#FF0000] animate-pulse" strokeWidth={3} />
          <h1 className="text-4xl md:text-6xl font-black text-[#FF0000] italic">
            戰情指揮看板
          </h1>
        </div>

        <div className="w-full text-center space-y-1">
          {/* 案件內容：鮮紅色、粗體、字體加大 */}
          <div className="text-[28px] md:text-[40px] text-[#FF0000] font-black leading-tight mb-1">
            {caseNameValue}
          </div>
          {/* 指揮官：鮮紅色、非粗體 */}
          <div className="text-[22px] md:text-[32px] text-[#FF0000] font-medium mb-2">
            指揮官：{commanderValue}
          </div>
          {/* 時間：字體加大 */}
          <div className="text-[36px] md:text-[52px] font-mono text-emerald-400 font-bold leading-none">
            {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
          </div>
          <div className="text-slate-500 text-sm font-medium opacity-60">
            {currentTime.toLocaleDateString('zh-TW')} | 系統穩定運作中
          </div>
        </div>
      </header>

      {/* 數據卡片：手機版優化排列 */}
      <div className="flex flex-col gap-3 mb-8">
        {cardItems.map((item, index) => {
          const styleClass = colorMap[item.編號] || 'bg-slate-800 border-slate-600 text-white';
          
          // 判斷是否需要合併顯示（同編號且在手機版水平並列）
          const isGrouped = index > 0 && item.編號 === cardItems[index-1].編號 && ['f', 'b', 'c'].includes(item.編號);
          
          // 由於 React Render 邏輯，我們改用 grid 佈局來達成「同編號同列」的視覺效果
          return (
            <div 
              key={index} 
              className={`w-full p-4 rounded-xl border-2 shadow-inner flex flex-col items-center justify-center text-center transition-transform active:scale-95 ${styleClass}`}
            >
              <div className="text-sm md:text-lg font-bold uppercase tracking-widest opacity-90 mb-1">
                {item.項目名稱}
              </div>
              <div className="text-2xl md:text-4xl font-black tracking-tighter">
                {item.內容}
              </div>
            </div>
          );
        })}
      </div>

      {/* 地圖區域 */}
      <section className="mt-6 border-t border-slate-800 pt-6">
        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 h-[350px] md:h-[600px] relative shadow-2xl">
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <Loader2 className="animate-spin text-red-500 mb-4" size={32} />
              <p className="text-xs font-mono text-slate-500">MAP INITIALIZING...</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full z-10 grayscale-[0.3]" />
        </div>
      </section>

      <footer className="mt-8 pb-4 text-center text-slate-700 text-[10px] uppercase tracking-[0.4em] font-mono">
        Rescue Command Center | Operational Data Stable
      </footer>
    </div>
  );
};

export default App;
