import { useEffect } from "react";
import { toast } from "react-toastify";

/**
 * Component to handle session expired notifications
 * Shows toast messages based on URL parameters
 */
export function SessionNotifications() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("expired") === "true") {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
        toastId: "session-expired", // Prevent duplicate toasts
      });

      // Clean up URL
      urlParams.delete("expired");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }

    if (urlParams.get("required") === "true") {
      toast.info("Vui lòng đăng nhập để tiếp tục.", {
        toastId: "login-required",
      });

      // Clean up URL
      urlParams.delete("required");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return null; // This component doesn't render anything
}
