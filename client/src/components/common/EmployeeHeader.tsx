import { } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '/logo.png';

export default function EmployeeHeader(){
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/employee/news" className="brand">
          <img src={logo} alt="Logo" className="logo" style={{height:32}} />
          <span style={{marginLeft:8}}>Manager</span>
        </Link>

        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{marginRight:8}}>{user?.name}</div>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
