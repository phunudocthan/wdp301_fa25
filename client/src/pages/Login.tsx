import { useState, FormEvent } from "react";
import { useAuth } from "../components/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!email || !password) {
        toast.error("Vui lòng nhập email và mật khẩu");
        return;
      }
      await login(email, password);

      // Sau khi login thành công → redirect về profile hoặc trang trước đó
      const to = (loc.state as any)?.from?.pathname || "/profile";
      nav(to, { replace: true });

      toast.success("Đăng nhập thành công!");
    } catch (err) {
      // Lỗi sẽ được xử lý trong http.ts, chỉ cần toast chung ở đây
      toast.error("Đăng nhập thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold text-center mb-4">Đăng nhập</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Chưa có tài khoản?{" "}
          <span
            onClick={() => nav("/register")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}
