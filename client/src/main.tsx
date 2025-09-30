import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// App chính
import App from "./App";

// Import SCSS global
import "./styles/global.scss";
import "./styles/theme.scss";
import "./styles/layout.scss";
import "./styles/footer.scss";
import "./styles/searchbar.scss";


// Context providers
import { AuthProvider } from "./components/context/AuthContext";
import { ThemeProvider } from "./components/context/ThemeContext";
import "bootstrap/dist/css/bootstrap.min.css";

// Toast provider
import ToastProvider from "./components/ui/ToastProvider";

// Lấy root element từ index.html
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "❌ Không tìm thấy #root. Hãy kiểm tra lại index.html có <div id='root'></div>."
  );
}

// Tạo root render React 18
const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* Toast global cho toàn app */}
          <ToastProvider />
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
