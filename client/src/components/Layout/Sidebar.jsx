import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/create-invoice', icon: PlusCircle, label: 'Create Invoice' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/reports', icon: BarChart3, label: 'GST Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">G</div>
          <div className="sidebar-logo-text">
            <h1>GST IMS</h1>
            <p>Invoice Management</p>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="sidebar-business">
        <p className="sidebar-business-label">Business</p>
        <p className="sidebar-business-name" title={user?.businessName}>
          {user?.businessName}
        </p>
        <p className="sidebar-business-gstin">GSTIN: {user?.gstin}</p>
      </div>

      {/* Navigation */}
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

      {/* Logout */}
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