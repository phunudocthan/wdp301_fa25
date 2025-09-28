import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { useAuth } from "../components/context/AuthContext";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = useCallback(
    async ({ name, email, password, phone }: RegisterPayload) => {
      await register(name, email, password, phone);
    },
    [register]
  );

  const handleNavigateLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <RegisterForm
      onRegister={handleRegister}
      onNavigateLogin={handleNavigateLogin}
    />
  );
};

export default Register;
