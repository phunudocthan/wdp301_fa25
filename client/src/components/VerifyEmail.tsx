import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token || !isMounted) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/verify-email?token=${token}`,
          { headers: { "Cache-Control": "no-cache" } }
        );
        if (isMounted) {
          alert(response.data.message); // Hiển thị thông báo "Email verified successfully. You can now login."
          if (
            response.data.message.includes("successfully") ||
            response.data.message.includes("already verified") ||
            response.data.message.includes("used")
          ) {
            window.location.href = "/login"; // Chuyển hướng sau khi xác thực thành công
          }
        }
      } catch (error: any) {
        if (isMounted) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Verification failed";
          console.error(
            "Verification error:",
            error.response?.data || error.message
          );
          alert(errorMessage);
          if (errorMessage === "This verification link is no longer valid.") {
            window.location.href = "/login"; // Chuyển hướng nếu token không còn hợp lệ
          }
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return <div>Verifying your email...</div>;
};

export default VerifyEmail;
