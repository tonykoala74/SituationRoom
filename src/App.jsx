import { useState, useEffect } from 'react';
import Papa from 'papaparse';

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
          // 過濾掉空行 (SRS 6.2 規範)
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

  // 核心升級 1：定義自動變色邏輯
  const getRowStyle = (row) => {
    const rowString = JSON.stringify(row); // 檢查整列內容
    if (rowString.includes('火警') || rowString.includes('緊急') || rowString.includes('受困')) {
      return {
        backgroundColor: '#fff5f5', // 淺紅色背景
        color: '#d32f2f',           // 深紅色文字
        fontWeight: 'bold',
        transition: '0.3s'
      };
    }
    return { backgroundColor: 'white', color: 'black' };
  };

  return (
    <div style={{ padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #d32f2f', marginBottom: '20px' }}>
        <h1 style={{ color: '#d32f2f', margin: '10px 0' }}>🚒 救災戰情看板</h1>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>更新頻率：30s</span>
          <p style={{ margin: 0, fontWeight: 'bold' }}>最後更新：{lastUpdate || '讀取中...'}</p>
        </div>
      </header>
      
      {data.length > 0 ? (
        <div style={{ overflowX: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#d32f2f', color: 'white' }}>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} style={getRowStyle(row)}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {/* 如果是火警，前面加個小圖示 */}
                      {(val === '火警' || val === '緊急') ? `🔥 ${val}` : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>正在從 Google Sheets 載入救災資料...</p>
        </div>
      )}
    </div>
  );
}

export default App;
