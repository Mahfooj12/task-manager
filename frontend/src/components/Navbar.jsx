import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>TaskManager</Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/projects" style={{ color: '#4b5563', textDecoration: 'none' }}>Projects</Link>
          <Link to="/tasks" style={{ color: '#4b5563', textDecoration: 'none' }}>Tasks</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#6b7280' }}>{user?.name}</span>
            {isAdmin && <span className="status-badge" style={{ background: '#8b5cf6', color: 'white' }}>Admin</span>}
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 12px' }}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;