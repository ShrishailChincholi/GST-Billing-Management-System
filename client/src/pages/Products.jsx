import React, { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// ✅ Use empty strings for numeric fields so they show as empty in the form
const INITIAL_FORM = {
  name: '',
  description: '',
  hsnCode: '',
  unit: 'PCS',
  rate: '',       // ← string, empty by default
  gstRate: 18,
  stock: '',      // ← string, empty by default
};

const UNITS = ['PCS', 'KGS', 'LTR', 'MTR', 'BOX', 'SET', 'NOS', 'SQF', 'HR', 'PKT', 'DZN'];
const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gstFilter, setGstFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.hsnCode.toLowerCase().includes(q)
      );
    }
    if (gstFilter !== '') {
      result = result.filter((p) => p.gstRate === Number(gstFilter));
    }
    setFiltered(result);
  }, [search, gstFilter, products]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.data);
      setFiltered(data.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product._id);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        hsnCode: product.hsnCode || '',
        unit: product.unit || 'PCS',
        // Convert number to string for input display
        rate: product.rate !== undefined && product.rate !== null ? String(product.rate) : '',
        gstRate: product.gstRate || 18,
        stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '',
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

    // ===== Validate =====
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.hsnCode.trim()) {
      toast.error('HSN/SAC code is required');
      return;
    }
    if (formData.rate === '' || Number(formData.rate) <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    setSaving(true);

    // ===== Convert strings to numbers before sending =====
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      hsnCode: formData.hsnCode.trim(),
      unit: formData.unit,
      rate: Number(formData.rate),
      gstRate: Number(formData.gstRate),
      stock: formData.stock === '' ? 0 : Number(formData.stock),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <Header title="Products" />

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
                    placeholder="Search by name or HSN code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field"
                  />
                </div>

                <select
                  value={gstFilter}
                  onChange={(e) => setGstFilter(e.target.value)}
                  className="invoice-list-filter-select"
                >
                  <option value="">All GST Rates</option>
                  {GST_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r}% GST
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="btn btn-primary"
              >
                <Plus size={18} /> Add Product
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Package size={64} className="empty-state-icon" />
                <h3>
                  {search || gstFilter ? 'No products found' : 'No products yet'}
                </h3>
                <p>
                  {search || gstFilter
                    ? 'Try a different filter.'
                    : 'Add your first product to start billing.'}
                </p>
                {!search && !gstFilter && (
                  <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                  >
                    <Plus size={18} /> Add Product
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>HSN / SAC</th>
                      <th>Unit</th>
                      <th>Rate</th>
                      <th>GST</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div>
                            <p
                              style={{
                                fontWeight: 500,
                                color: 'var(--color-gray-900)',
                                marginBottom: 2,
                              }}
                            >
                              {product.name}
                            </p>
                            {product.description && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color: 'var(--color-gray-500)',
                                  maxWidth: 320,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {product.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              color: 'var(--color-gray-700)',
                              background: 'var(--color-gray-100)',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {product.hsnCode}
                          </span>
                        </td>
                        <td style={{ fontSize: 13 }}>{product.unit}</td>
                        <td className="table-amount">
                          {formatCurrency(product.rate)}
                        </td>
                        <td>
                          <span className="badge badge-issued">
                            {product.gstRate}%
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color:
                                product.stock <= 5
                                  ? 'var(--color-danger)'
                                  : product.stock <= 10
                                  ? 'var(--color-warning)'
                                  : 'var(--color-gray-700)',
                            }}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <div
                            className="table-actions"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="table-action-btn primary"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
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

      {/* Product Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div
            className="modal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
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
                {/* Product Name */}
                <div className="form-group">
                  <label className="label label-required">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="LED Bulb 9W"
                    autoFocus
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                {/* HSN + Unit */}
                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label label-required">HSN / SAC Code</label>
                    <input
                      type="text"
                      value={formData.hsnCode}
                      onChange={(e) =>
                        setFormData({ ...formData, hsnCode: e.target.value })
                      }
                      className="input-field"
                      placeholder="9405"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label label-required">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="input-field"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rate + GST */}
                <div className="invoice-form-row two-col">
                  <div className="form-group">
                    <label className="label label-required">Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rate: e.target.value,   // ✅ keep as string
                        })
                      }
                      className="input-field"
                      placeholder="150"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label label-required">GST Rate (%)</label>
                    <select
                      value={formData.gstRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gstRate: Number(e.target.value),
                        })
                      }
                      className="input-field"
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-gray-500)',
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      Used only for GST bills. Cash bills ignore this.
                    </span>
                  </div>
                </div>

                {/* Stock */}
                <div className="form-group">
                  <label className="label">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value,   // ✅ keep as string
                      })
                    }
                    className="input-field"
                    placeholder="0"
                  />
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
                  {saving
                    ? 'Saving...'
                    : editingId
                    ? 'Update Product'
                    : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;