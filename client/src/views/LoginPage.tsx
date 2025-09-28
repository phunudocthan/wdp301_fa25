import React from 'react';
import Login from '../components/Login';
import { useAuthContext } from '../stores/AuthContext';

const LoginPage: React.FC = () => {
  const { handleLogin } = useAuthContext();

  // handleLogin nhận cả user và token, nên truyền đúng từ Login component
  return <Login onLogin={handleLogin} />;
};

export default LoginPage;


