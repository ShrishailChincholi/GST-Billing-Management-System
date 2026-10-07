import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title">
          <h1>{title}</h1>
          <p>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="header-actions">
          {/* Search */}
          <div className="header-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input-field"
            />
          </div>

          {/* Notifications */}
          <button className="header-notification">
            <Bell size={20} />
            <span className="header-notification-dot"></span>
          </button>

          {/* User */}
          <div className="header-user">
            <div className="header-user-avatar">
              <User size={18} />
            </div>
            <div className="header-user-info">
              <p className="header-user-name">{user?.name}</p>
              <p className="header-user-role">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;