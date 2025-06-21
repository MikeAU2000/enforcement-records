import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/172LoL3OTg65HQ8Wrpdj_bjEs9c8bFRIf1916GyZ0F_A/export?format=csv';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(CSV_URL);
      
      Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setLastUpdated(new Date().toLocaleString('zh-TW'));
          setLoading(false);
        },
        error: (error) => {
          setError('解析CSV數據時發生錯誤');
          setLoading(false);
        }
      });
    } catch (err) {
      setError('無法獲取數據，請檢查網路連接');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 每5分鐘自動更新一次數據
    const interval = setInterval(fetchData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h1>裁判執法紀錄</h1>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          <h1>裁判執法紀錄</h1>
          <p className="error-message">{error}</p>
          <button onClick={handleRefresh} className="refresh-btn">
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <h1>裁判執法紀錄</h1>
        <div className="header-controls">
          <button onClick={handleRefresh} className="refresh-btn">
            刷新數據
          </button>
          {lastUpdated && (
            <span className="last-updated">
              最後更新: {lastUpdated}
            </span>
          )}
        </div>
      </header>
      
      <main className="main-content">
        {data.length === 0 ? (
          <p className="no-data">暫無數據</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(data[0]).map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      <footer className="footer">
        <p>數據來源: Google Sheets | 自動更新間隔: 5分鐘 | 可手動點擊「刷新數據」按鈕更新</p>
      </footer>
    </div>
  );
}

export default App;
