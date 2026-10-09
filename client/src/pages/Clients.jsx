import React, { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  X,
} from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  gstin: '',
  email: '',
  phone: '',
  clientType: 'B2B',
  billingAddress: {
    street: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    country: 'India',
  },
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(clients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.gstin && c.gstin.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q))
        )
      );
    }
  }, [search, clients]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data.data);
      setFiltered(data.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingId(client._id);
      setFormData({
        name: client.name || '',
        gstin: client.gstin || '',
        email: client.email || '',
        phone: client.phone || '',
        clientType: client.clientType || 'B2B',
        billingAddress: {
          street: client.billingAddress?.street || '',
          city: client.billingAddress?.city || '',
          state: client.billingAddress?.state || '',
          stateCode: client.billingAddress?.stateCode || '',
          pincode: client.billingAddress?.pincode || '',
          country: 'India',
        },
      });
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', formData);
        toast.success('Client created successfully');
      }
      handleCloseModal();
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <Header title="Clients" />

      <div className="page-content">
        <div className="page-content-inner">
          <div className="table-container">
            {/* Toolbar */}
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <div className="table-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, GSTIN, email, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="btn btn-primary"
              >
                <Plus size={18} /> Add Client
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Users size={64} className="empty-state-icon" />
                <h3>{search ? 'No clients found' : 'No clients yet'}</h3>
                <p>
                  {search
                    ? 'Try a different search term.'
                    : 'Add your first client to start creating invoices.'}
                </p>
                {!search && (
                  <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                  >
                    <Plus size={18} /> Add Client
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>GSTIN</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: 'var(--color-primary-100)',
                                color: 'var(--color-primary-700)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(client.name)}
                            </div>
                            <span
                              style={{
                                fontWeight: 500,
                                color: 'var(--color-gray-900)',
                              }}
                            >
                              {client.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          {client.gstin ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                color: 'var(--color-gray-700)',
                              }}
                            >
                              {client.gstin}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-gray-400)', fontSize: 12 }}>
                              Unregistered
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {client.email && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--color-gray-600)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Mail size={12} /> {client.email}
                              </span>
                            )}
                            {client.phone && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--color-gray-600)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Phone size={12} /> {client.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {client.billingAddress?.city ? (
                            <span
                              style={{
                                fontSize: 12,
                                color: 'var(--color-gray-600)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <MapPin size={12} />
                              {client.billingAddress.city}
                              {client.billingAddress.state &&
                                `, ${client.billingAddress.state}`}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-gray-400)', fontSize: 12 }}>
                              —
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              client.clientType === 'B2B'
                                ? 'badge-issued'
                                : client.clientType === 'B2C'
                                ? 'badge-draft'
                                : client.clientType === 'SEZ'
                                ? 'badge-paid'
                                : 'badge-overdue'
                            }`}
                          >
                            {client.clientType}
                          </span>
                        </td>
                        <td>
                          <div
                            className="table-actions"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            <button
                              onClick={() => handleOpenModal(client)}
                              className="table-action-btn primary"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(client._id)}
                              className="table-action-btn danger"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {editingId ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="btn-ghost"
                style={{
                  padding: 6,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-gray-500)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label label-required">Client Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="ABC Traders Pvt Ltd"
                    required
                  />
                </div>

                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label">GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gstin: e.target.value.toUpperCase(),
                        })
                      }
                      className="input-field"
                      placeholder="29AABCT1332L1Z8"
                      maxLength={15}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Client Type</label>
                    <select
                      value={formData.clientType}
                      onChange={(e) =>
                        setFormData({ ...formData, clientType: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="B2B">B2B (Business)</option>
                      <option value="B2C">B2C (Consumer)</option>
                      <option value="SEZ">SEZ Unit</option>
                      <option value="Export">Export</option>
                    </select>
                  </div>
                </div>

                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field"
                      placeholder="contact@abctraders.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--color-gray-500)',
                    letterSpacing: '0.05em',
                    marginTop: 'var(--space-6)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  Billing Address
                </h4>

                <div className="form-group">
                  <label className="label">Street Address</label>
                  <input
                    type="text"
                    value={formData.billingAddress.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAddress: {
                          ...formData.billingAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    className="input-field"
                    placeholder="123, Brigade Road"
                  />
                </div>

                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label">City</label>
                    <input
                      type="text"
                      value={formData.billingAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                      placeholder="Bangalore"
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">State</label>
                    <input
                      type="text"
                      value={formData.billingAddress.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                      placeholder="Karnataka"
                    />
                  </div>
                </div>

                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label">State Code</label>
                    <input
                      type="text"
                      value={formData.billingAddress.stateCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            stateCode: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                      placeholder="29"
                      maxLength={2}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Pincode</label>
                    <input
                      type="text"
                      value={formData.billingAddress.pincode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            pincode: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                      placeholder="560001"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Clients;