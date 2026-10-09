import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Mail, Lock, Eye, EyeOff, Building2, User } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    gstin: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      stateCode: '',
      pincode: '',
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [e.target.name]: e.target.value },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await register(formData);
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
            Start billing<br />in minutes
          </h2>
          <p>
            Set up your business profile once and generate unlimited GST-compliant
            invoices with automatic CGST/SGST/IGST calculations.
          </p>

          <div className="auth-features">
            {[
              { label: 'Free Setup', desc: 'No credit card needed' },
              { label: 'GST Ready', desc: 'GSTR-1 & 3B reports' },
              { label: 'Multi-User', desc: 'Team collaboration' },
              { label: 'Secure', desc: '256-bit encryption' },
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

      {/* Right Panel - Register Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">
              <FileText size={20} />
            </div>
            <h1>GST IMS</h1>
          </div>

          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Set up your business in under 2 minutes</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-grid">
              <div className="form-group">
                <label className="label label-required">Full Name</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon-left" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field input-with-icon-left"
                    placeholder="Rajesh Kumar"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label label-required">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label label-required">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field input-with-icon-left"
                  placeholder="you@business.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label label-required">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field input-with-icon-left input-with-icon-right"
                  placeholder="Minimum 6 characters"
                  minLength={6}
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

            <div className="form-group">
              <label className="label label-required">Business Name</label>
              <div className="input-icon-wrapper">
                <Building2 size={18} className="input-icon-left" />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="input-field input-with-icon-left"
                  placeholder="Kumar Enterprises"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label label-required">GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                className="input-field"
                placeholder="27AAPFU0939F1ZV"
                maxLength={15}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--color-gray-500)', marginTop: 4, display: 'block' }}>
                15-character GST Identification Number
              </span>
            </div>

            <div className="auth-form-grid">
              <div className="form-group">
                <label className="label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="Mumbai"
                />
              </div>

              <div className="form-group">
                <label className="label">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="Maharashtra"
                />
              </div>
            </div>

            <div className="auth-form-grid">
              <div className="form-group">
                <label className="label">State Code</label>
                <input
                  type="text"
                  name="stateCode"
                  value={formData.address.stateCode}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="27"
                  maxLength={2}
                />
              </div>

              <div className="form-group">
                <label className="label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.address.pincode}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="400001"
                  pattern="[0-9]{6}"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;