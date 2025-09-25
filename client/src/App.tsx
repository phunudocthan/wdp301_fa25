import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

interface ApiResponse {
  message: string;
  timestamp: string;
  database: string;
}

function App() {
  const [serverStatus, setServerStatus] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/test");
        setServerStatus(response.data);
        setError(null);
      } catch (err) {
        setError("Không thể kết nối với server");
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="App">
      <h1>LEGO E-commerce</h1>

      <div className="status">
        {loading && <p>Đang kiểm tra kết nối...</p>}

        {error && (
          <div>
            <p style={{ color: "red" }}>❌ {error}</p>
            <button onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        )}

        {serverStatus && !loading && !error && (
          <div>
            <p style={{ color: "green" }}>✅ Kết nối thành công!</p>
            <p>Database: {serverStatus.database}</p>
          </div>
        )}
      </div>

      <div className="info">
        <h3>Project Setup Complete</h3>
        <ul>
          <li>Server: ExpressJS + MongoDB Atlas</li>
          <li>Client: ReactJS + TypeScript</li>
          <li>Ready for development</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
