import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface ApiResponse {
  message: string;
  timestamp: string;
  database: string;
}

function App() {
  const [serverStatus, setServerStatus] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/test')
        setServerStatus(response.data)
        setError(null)
      } catch (err) {
        setError('Không thể kết nối với server. Vui lòng kiểm tra server đã chạy chưa.')
        console.error('Connection error:', err)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧱 LEGO E-commerce System</h1>
        <p>Hệ thống thương mại điện tử LEGO</p>
        
        <div className="status-section">
          <h2>📡 Trạng thái kết nối</h2>
          
          {loading && (
            <div className="loading">
              <p>🔄 Đang kiểm tra kết nối...</p>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>❌ {error}</p>
              <button onClick={handleRefresh} className="retry-btn">
                🔄 Thử lại
              </button>
            </div>
          )}
          
          {serverStatus && !loading && !error && (
            <div className="success">
              <p>✅ Kết nối thành công!</p>
              <div className="server-info">
                <p><strong>Server:</strong> {serverStatus.message}</p>
                <p><strong>Database:</strong> {serverStatus.database}</p>
                <p><strong>Thời gian:</strong> {new Date(serverStatus.timestamp).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="features-section">
          <h2>🚀 Tính năng chính</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>👤 Quản lý người dùng</h3>
              <p>Đăng ký, đăng nhập, phân quyền</p>
            </div>
            <div className="feature-card">
              <h3>🧱 Quản lý sản phẩm LEGO</h3>
              <p>CRUD sản phẩm, tìm kiếm, lọc</p>
            </div>
            <div className="feature-card">
              <h3>🛒 Giỏ hàng & Đơn hàng</h3>
              <p>Thêm vào giỏ, thanh toán COD/VNPay</p>
            </div>
            <div className="feature-card">
              <h3>⭐ Đánh giá & Cộng đồng</h3>
              <p>Review sản phẩm, gallery, AI chat</p>
            </div>
          </div>
        </div>

        <div className="api-info">
          <h3>🔧 API Endpoints</h3>
          <ul>
            <li><code>GET /api/test</code> - Test kết nối</li>
            <li><code>GET /api/health</code> - Health check</li>
            <li><code>/api/auth</code> - Xác thực người dùng</li>
            <li><code>/api/legos</code> - Quản lý sản phẩm LEGO</li>
            <li><code>/api/orders</code> - Quản lý đơn hàng</li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App
