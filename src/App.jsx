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
          if (results.data && results.data.length > 0) {
            setData(results.data);
            setLastUpdate(new Date().toLocaleTimeString());
          }
        },
        error: (err) => console.error("抓取失敗:", err)
      });
    };

    // 初始執行
    fetchData();

    // 設置 30 秒定時刷新 (SRS 3.2 規範)
    const timer = setInterval(fetchData, 30000);

    // 清理機制，避免記憶體洩漏
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#d32f2f' }}>🚒 救災戰情看板</h1>
      <p>最後更新時間：{lastUpdate || '讀取中...'}</p>
      <hr />
      
      {data.length > 0 ? (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>正在從 Google Sheets 載入救災資料...</p>
      )}
    </div>
  );
}

export default App;
