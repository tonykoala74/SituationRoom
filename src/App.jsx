import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Activity, Navigation, Loader2 } from 'lucide-react';

const App = () => {
  const [data, setData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  // 定義顏色循環，用於同編號（a, b, c...）同色
  const colors = {
    a: 'border-blue-500 text-blue-400',
    b: 'border-emerald-500 text-emerald-400',
    c: 'border-amber-500 text-amber-400',
    d: 'border-purple-500 text-purple-400',
    e: 'border-red-500 text-red-400',
    f: 'border-pink-500 text-pink-400',
    g: 'border-orange-500 text-orange-400'
  };

  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    const fetchData = () => {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
          // 過濾空行並去除頭部/尾部空格
          const filtered = results.data.filter(row => row.項目名稱 && row.項目名稱.trim() !== "");
          setData(filtered);
        },
        error: () => setError("資料同步失敗")
      });
    };

    fetchData();
    const dTimer = setInterval(fetchData, 30000);

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
    return () => clearInterval(dTimer);
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

  // 從列表中尋找特定項目的內容
  const findValue = (name) => data.find(item => item.項目名稱 === name)?.內容 || "---";

  const caseName = findValue("案件名稱");
  const commander = findValue("指揮官");

  // 過濾掉「案件名稱」與「指揮官」，剩下的才是要顯示的卡片
  // 同時過濾掉「地圖」項目，因為地圖會放在最下面
  const displayItems = data.filter(item => 
    item.項目名稱 !== "案件名稱" && 
    item.項目名稱 !== "指揮官" &&
    !item.項目名稱.includes("leafjet")
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans tracking-tight">
      {/* Header - 案件名稱與指揮官 */}
      <header className="flex flex-col items-center mb-8 border-b border-slate-800 pb-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-slate-400 mb-2 tracking-widest">
          {caseName}
        </h2>
        <h1 className="text-4xl md:text-6xl font-black text-red-500 flex items-center gap-4 italic uppercase">
          <Activity size={48} strokeWidth={3} /> 指揮官：{commander}
        </h1>
        <div className="flex items-center gap-2 mt-6 text-emerald-500 font-mono text-sm bg-emerald-950/30 px-4 py-1 rounded-full border border-emerald-900/50">
          <Navigation size={14} className="animate-pulse" /> 穩定連線中 | 每 30 秒自動刷新
        </div>
      </header>

      {/* 數據卡片區域 */}
      <main className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {displayItems.map((item, index) => {
            // 根據「編號」欄位決定顏色
            const colorClass = colors[item.編號] || 'border-slate-700 text-slate-400';

            return (
              <div 
                key={index} 
                className={`bg-slate-900 border-l-[12px] ${colorClass} p-6 rounded-2xl shadow-2xl flex flex-col justify-between min-h-[180px] hover:scale-[1.02] transition-transform`}
              >
                <div className="text-xl md:text-2xl font-black text-slate-100 leading-tight mb-2">
                  {item.項目名稱}
                </div>
                <div className="text-3xl md:text-5xl font-black tracking-tighter truncate">
                  {item.內容}
                </div>
              </div>
            );
          })}
        </div>

        {/* 地圖區域 - 放置於最下方 */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[2px] flex-1 bg-slate-800"></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em]">現場地理座標地圖</h3>
            <div className="h-[2px] flex-1 bg-slate-800"></div>
          </div>
          
          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 h-[450px] md:h-[650px] relative shadow-2xl">
            {!mapLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="font-mono text-blue-400">GEOGRAPHIC SYSTEM LOADING...</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full z-10" />
          </div>
        </section>
      </main>

      <footer className="mt-12 pb-8 text-center text-slate-700 text-[10px] uppercase tracking-[0.6em] font-mono">
        Rescue Command Center | Operational Data Stable
      </footer>
    </div>
  );
};

export default App;
