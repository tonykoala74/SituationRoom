import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// --- 子元件開發 ---

// 1. DashboardCard：高對比度數值顯示元件
const DashboardCard = ({ title, value, unit, color = "#d32f2f" }) => (
  <div style={{
    backgroundColor: 'white',
    borderLeft: `8px solid ${color}`,
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }}>
    <span style={{ fontSize: '16px', color: '#666', fontWeight: 'bold' }}>{title}</span>
    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
      <span style={{ fontSize: '42px', fontWeight: '900', color: color }}>{value}</span>
      <span style={{ fontSize: '18px', color: '#333', marginLeft: '8px' }}>{unit}</span>
    </div>
  </div>
);

// 2. CountdownTimer：撤退/日落時間倒數邏輯
const CountdownTimer = ({ targetTime, label }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      // 將字串時間轉為今日的日期物件
      const [h, m, s] = targetTime.split(':');
      const target = new Date();
      target.setHours(h, m, s || 0);

      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("時間到");
      } else {
        const hh = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mm = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hh}時 ${mm}分`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // 每分鐘更新一次
    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div style={{ backgroundColor: '#333', color: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '14px', color: '#bbb' }}>{label}</h3>
      <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 'bold', color: '#ffeb3b' }}>{timeLeft}</p>
    </div>
  );
};

// --- 主程式 ---

function App() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const sheetUrl = import.meta.env.VITE_SHEET_URL;

    const fetchData = () => {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
          const filteredData = results.data.filter(row => Object.values(row).some(val => val !== ""));
          if (filteredData.length > 0) {
            setData(filteredData);
            setLastUpdate(new Date().toLocaleTimeString());
          }
        },
        error: (err) => console.error("抓取失敗:", err)
      });
    };

    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const getRowStyle = (row) => {
    const rowString = JSON.stringify(row);
    if (rowString.includes('火警') || rowString.includes('緊急') || rowString.includes('受困')) {
      return { backgroundColor: '#fff5f5', color: '#d32f2f', fontWeight: 'bold' };
    }
    return { backgroundColor: 'white', color: 'black' };
  };

  // 計算統計數值
  const emergencyCount = data.filter(r => JSON.stringify(r).includes('火警') || JSON.stringify(r).includes('緊急')).length;

  return (
    <div style={{ padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#d32f2f', margin: 0, fontSize: '28px', borderLeft: '8px solid #d32f2f', paddingLeft: '15px' }}>
          🚒 前進指揮所戰情看板
        </h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#666' }}>更新頻率：30s</p>
          <p style={{ margin: 0, fontWeight: 'bold' }}>最後更新：{lastUpdate || '讀取中...'}</p>
        </div>
      </header>

      {/* 第三步的核心：Dashboard 摘要區 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <DashboardCard title="現場案件總數" value={data.length} unit="件" color="#1976d2" />
        <DashboardCard title="緊急優先處理" value={emergencyCount} unit="件" color="#d32f2f" />
        <CountdownTimer targetTime="18:00:00" label="今日預計搜索截止" />
      </div>
      
      {data.length > 0 ? (
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>📋 即時任務清單</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', color: '#333', textAlign: 'left' }}>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} style={getRowStyle(row)}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {(val === '火警' || val === '緊急') ? `🚨 ${val}` : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>正在載入戰情數據...</p>
        </div>
      )}
    </div>
  );
}

export default App;
