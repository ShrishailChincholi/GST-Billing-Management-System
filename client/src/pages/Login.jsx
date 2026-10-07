import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Left Panel - Branding */}
      <div className="auth-branding">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">
            <FileText size={24} />
          </div>
          <div>
            <h1>GST IMS</h1>
            <p>Invoice Management System</p>
          </div>
        </div>

        <div className="auth-brand-content">
          <h2>
            Simplify your GST billing<br />for your business
          </h2>
          <p>
            Generate GST-compliant invoices, track payments, manage clients, and
            file returns — all from one powerful dashboard.
          </p>

          <div className="auth-features">
            {[
              { label: 'GST Compliant', desc: 'Auto CGST/SGST/IGST' },
              { label: 'PDF Invoices', desc: 'Professional templates' },
              { label: 'GST Reports', desc: 'GSTR-1 & GSTR-3B' },
              { label: 'Multi-Client', desc: 'B2B, B2C, SEZ, Export' },
            ].map((item) => (
              <div key={item.label} className="auth-feature">
                <p className="auth-feature-title">{item.label}</p>
                <p className="auth-feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="auth-brand-footer">
          © {new Date().getFullYear()} GST IMS. Made in India 🇮🇳
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">
              <FileText size={20} />
            </div>
            <h1>GST IMS</h1>
          </div>

          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your billing dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-icon-left"
                  placeholder="you@business.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon-left input-with-icon-right"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-form-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;