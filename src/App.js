import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // 過濾功能相關的 state
  const [filters, setFilters] = useState({
    refereeId: '',    // 裁判編號
    group: '',        // 組別
    year: ''          // 年份
  });
  const [filteredData, setFilteredData] = useState([]);

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/172LoL3OTg65HQ8Wrpdj_bjEs9c8bFRIf1916GyZ0F_A/export?format=csv';

  // 過濾數據的函數
  const applyFilters = useCallback(() => {
    let filtered = data;
    
    // 根據裁判編號過濾
    if (filters.refereeId) {
      filtered = filtered.filter(row => 
        row['裁判編號'] && row['裁判編號'].toString().includes(filters.refereeId)
      );
    }
    
    // 根據組別過濾
    if (filters.group) {
      filtered = filtered.filter(row => 
        row['組別'] && row['組別'].toString().includes(filters.group)
      );
    }
    
    // 根據年份過濾 - 支援日期格式的年份匹配
    if (filters.year) {
      filtered = filtered.filter(row => {
        // 檢查多個可能的日期欄位
        const dateFields = ['年份', '日期', '執法日期', '比賽日期'];
        return dateFields.some(field => {
          if (row[field]) {
            const fieldValue = row[field].toString();
            // 如果是完整日期格式 (如 2023/1/15)，提取年份部分
            if (fieldValue.includes('/')) {
              const year = fieldValue.split('/')[0];
              return year === filters.year;
            }
            // 如果是純年份格式，直接比較
            return fieldValue.includes(filters.year);
          }
          return false;
        });
      });
    }
    
    setFilteredData(filtered);
  }, [data, filters]);
  
  // 重置過濾器
  const resetFilters = () => {
    setFilters({
      refereeId: '',
      group: '',
      year: ''
    });
    setFilteredData(data);
  };
  
  // 處理過濾器輸入變化
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          setFilteredData(results.data); // 初始化過濾後的數據
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
  
  // 當原始數據或過濾條件改變時，重新應用過濾
  useEffect(() => {
    if (data.length > 0) {
      applyFilters();
    }
  }, [data, filters, applyFilters]);

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
      
      {/* 過濾器區域 */}
      <div className="filter-section">
        <h3>數據過濾</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="refereeId">裁判編號:</label>
            <input
              type="text"
              id="refereeId"
              value={filters.refereeId}
              onChange={(e) => handleFilterChange('refereeId', e.target.value)}
              placeholder="輸入裁判編號"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="group">組別:</label>
            <input
              type="text"
              id="group"
              value={filters.group}
              onChange={(e) => handleFilterChange('group', e.target.value)}
              placeholder="輸入組別"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="year">年份:</label>
            <input
              type="text"
              id="year"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              placeholder="輸入年份 (如: 2023)"
            />
          </div>
          
          <div className="filter-actions">
            <button onClick={resetFilters} className="reset-btn">
              重置過濾
            </button>
          </div>
        </div>
        
        <div className="filter-info">
          顯示 {filteredData.length} / {data.length} 筆記錄
        </div>
      </div>
      
      <main className="main-content">
        {filteredData.length === 0 ? (
          <p className="no-data">暫無符合條件的數據</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(filteredData[0]).map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
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
