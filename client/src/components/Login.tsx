// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Eye,
//   EyeOff,
//   Mail,
//   Lock,
//   User as UserIcon,
//   Blocks,
// } from "lucide-react";
// import { useAuth } from "./context/AuthContext";

// interface LoginProps {
//   // Không cần onLogin prop nữa vì sử dụng AuthContext trực tiếp
// }

// const Login: React.FC<LoginProps> = () => {
//   const navigate = useNavigate();
//   const { login, register } = useAuth();
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     name: "",
//     confirmPassword: "",
//   });
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isLoading, setIsLoading] = useState(false);

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.email) {
//       newErrors.email = "Email là bắt buộc";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Email không hợp lệ";
//     }

//     if (!formData.password) {
//       newErrors.password = "Mật khẩu là bắt buộc";
//     } else if (formData.password.length < 6) {
//       newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
//     }

//     if (!isLogin) {
//       if (!formData.name) {
//         newErrors.name = "Tên là bắt buộc";
//       }
//       if (formData.password !== formData.confirmPassword) {
//         newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     setIsLoading(true);

//     try {
//       if (isLogin) {
//         // Đăng nhập sử dụng AuthContext
//         await login(formData.email, formData.password);
//         navigate("/profile"); // Redirect sau khi login thành công
//       } else {
//         // Đăng ký sử dụng AuthContext
//         await register(formData.name, formData.email, formData.password);
//         // Sau đăng ký: chuyển sang trang gửi lại xác minh
//         navigate(
//           `/resend-verification?email=${encodeURIComponent(formData.email)}`
//         );
//       }
//       setIsLoading(false);
//     } catch (err: unknown) {
//       const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
//       setErrors({ email: message });
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-center">
//           <div className="flex items-center justify-center mb-2">
//             <Blocks className="h-8 w-8 text-white mr-2" />
//             <h1 className="text-2xl font-bold text-white">Lego Store</h1>
//           </div>
//           <p className="text-white/90 text-sm">
//             Khám phá thế giới Lego tuyệt vời!
//           </p>
//         </div>

//         {/* Form */}
//         <div className="p-6">
//           <div className="text-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">
//               {isLogin ? "Đăng Nhập" : "Đăng Ký"}
//             </h2>
//             <p className="text-gray-600 text-sm">
//               {isLogin
//                 ? "Chào mừng bạn quay trở lại!"
//                 : "Tạo tài khoản để bắt đầu mua sắm"}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {!isLogin && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Họ và tên
//                 </label>
//                 <div className="relative">
//                   <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                     className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                       errors.name
//                         ? "border-red-300 bg-red-50"
//                         : "border-gray-300 hover:border-gray-400"
//                     }`}
//                     placeholder="Nhập họ và tên của bạn"
//                   />
//                 </div>
//                 {errors.name && (
//                   <p className="text-red-500 text-xs mt-1">{errors.name}</p>
//                 )}
//               </div>
//             )}

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                     errors.email
//                       ? "border-red-300 bg-red-50"
//                       : "border-gray-300 hover:border-gray-400"
//                   }`}
//                   placeholder="example@email.com"
//                 />
//               </div>
//               {errors.email && (
//                 <p className="text-red-500 text-xs mt-1">{errors.email}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Mật khẩu
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                     errors.password
//                       ? "border-red-300 bg-red-50"
//                       : "border-gray-300 hover:border-gray-400"
//                   }`}
//                   placeholder="••••••••"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5" />
//                   ) : (
//                     <Eye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="text-red-500 text-xs mt-1">{errors.password}</p>
//               )}
//             </div>

//             {!isLogin && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Xác nhận mật khẩu
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleInputChange}
//                     className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                       errors.confirmPassword
//                         ? "border-red-300 bg-red-50"
//                         : "border-gray-300 hover:border-gray-400"
//                     }`}
//                     placeholder="••••••••"
//                   />
//                 </div>
//                 {errors.confirmPassword && (
//                   <p className="text-red-500 text-xs mt-1">
//                     {errors.confirmPassword}
//                   </p>
//                 )}
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-red-500 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//             >
//               {isLoading ? (
//                 <div className="flex items-center justify-center">
//                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                   Đang xử lý...
//                 </div>
//               ) : isLogin ? (
//                 "Đăng Nhập"
//               ) : (
//                 "Đăng Ký"
//               )}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600 text-sm">
//               {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
//               <button
//                 onClick={() => {
//                   setIsLogin(!isLogin);
//                   setErrors({});
//                   setFormData({
//                     email: "",
//                     password: "",
//                     name: "",
//                     confirmPassword: "",
//                   });
//                 }}
//                 className="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors"
//               >
//                 {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
//               </button>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

//export default Login;
