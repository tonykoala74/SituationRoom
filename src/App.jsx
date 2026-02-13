import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Clock, Users, Map as LucideMap, Activity, Dog, Truck, 
  AlertTriangle, CheckCircle, Skull, CloudSun, Wind, 
  Droplets, Timer, Navigation, Loader2, AlertCircle 
} from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  // 動態統計邏輯：根據 Google Sheets 欄位名稱自動加總
  const getStats = () => {
    const sumField = (fieldName) => data.reduce((acc, row) => acc + (parseInt(row[fieldName]) || 0), 0);
    
    return {
      totalPersonnel: sumField('累計人數') || sumField('投入人數') || 0,
      realtimeOnsite: sumField('在場人數') || 0,
      rescued: sumField('獲救人數') || 0,
      pending: sumField('待救人數') || 0,
      deceased: sumField('死亡人數') || 0,
      weather: { temp: 24, humidity: 78, wind: "西北風 15km/h", condition: "多雲" }
    };
  };

  const dynamicStats = getStats();

  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;
    
    const fetchData = () => {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
          const filtered = results.data.filter(row => Object.values(row).some(v => v !== ""));
          setData(filtered);
        },
        error: () => setError("資料同步失敗")
      });
    };

    fetchData();
    const dTimer = setInterval(fetchData, 30000);
    const cTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    // 地圖資源載入
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

  const StatBox = ({ icon: Icon, label, value, color, subValue }) => (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={color} size={18} />}
        <span className="text-slate-400 text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {subValue && <div className="text-[10px] text-slate-500 mt-1">{subValue}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans tracking-tight">
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-red-500 flex items-center gap-2 italic">
            <Activity size={28} /> 救災現場戰情即時看板
          </h1>
          <p className="text-slate-500 text-xs mt-1">指揮官：Tony | 穩定連線中</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-xl text-emerald-400 font-bold">{currentTime.toLocaleTimeString('zh-TW', { hour12: false })}</div>
          <div className="text-slate-500 text-[10px]">{currentTime.toLocaleDateString('zh-TW')}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <StatBox icon={Users} label="現場總兵力" value={`${dynamicStats.totalPersonnel} 人`} color="text-blue-400" subValue="含支援單位" />
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">今日任務細節</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>待處理案件</span><span className="text-red-500 font-bold">{dynamicStats.pending}</span></div>
              <div className="flex justify-between"><span>已完成搜索</span><span className="text-emerald-500 font-bold">{dynamicStats.rescued}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 h-[400px] relative">
            {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80"><Loader2 className="animate-spin text-blue-500" /></div>}
            <div ref={mapRef} className="w-full h-full z-0" />
            <div className="absolute bottom-4 right-4 z-[1000] bg-red-600 px-4 py-2 rounded-lg shadow-xl animate-pulse text-white">
              <div className="text-[10px] font-bold">即時在場人數</div>
              <div className="text-xl font-black">{dynamicStats.realtimeOnsite} <span className="text-xs">人</span></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
              <Dog size={16} className="mx-auto text-orange-400 mb-1" />
              <div className="text-[10px] text-slate-500">搜救犬</div>
              <div className="font-bold text-xs">8 隻</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
              <Truck size={16} className="mx-auto text-blue-400 mb-1" />
              <div className="text-[10px] text-slate-500">重機具</div>
              <div className="font-bold text-xs">12 台</div>
            </div>
            {/* 更多機具可自行類推 */}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500"/>傷亡動態統計</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-emerald-950/30 rounded border border-emerald-900/50">
                <span className="text-xs text-emerald-500">獲救</span><span className="text-xl font-black text-emerald-500">{dynamicStats.rescued}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-950/30 rounded border border-amber-900/50">
                <span className="text-xs text-amber-500">待救</span><span className="text-xl font-black text-amber-500">{dynamicStats.pending}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-950/30 rounded border border-red-900/50">
                <span className="text-xs text-red-500">死亡</span><span className="text-xl font-black text-red-500">{dynamicStats.deceased}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
