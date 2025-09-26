import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { AuthProvider, useAuthContext } from './stores/AuthContext';

const AppRoutesWithContext: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  return <AppRouter isAuthenticated={isAuthenticated} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutesWithContext />
      </Router>
    </AuthProvider>
  );
}

export default App;