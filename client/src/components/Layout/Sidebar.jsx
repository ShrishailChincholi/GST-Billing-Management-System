import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Settings,
  LogOut,
  Receipt,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/new-bill', icon: ShoppingCart, label: 'New Bill' },
    { path: '/sales', icon: History, label: 'Sales History' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">G</div>
          <div className="sidebar-logo-text">
            <h1>GST Billing</h1>
            <p>Point of Sale</p>
          </div>
        </div>
      </div>

      <div className="sidebar-business">
        <p className="sidebar-business-label">Shop</p>
        <p className="sidebar-business-name" title={user?.businessName}>
          {user?.businessName}
        </p>
        <p className="sidebar-business-gstin">GSTIN: {user?.gstin}</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;