import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Send, FileText } from 'lucide-react';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [
        {
          name: '',
          hsnCode: '',
          quantity: 1,
          unit: 'PCS',
          rate: 0,
          discount: 0,
          gstRate: 18,
          cessRate: 0,
        },
      ],
      notes: '',
      terms: 'Payment due within 15 days.',
      isReverseCharge: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/products'),
      ]);
      setClients(clientsRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const items = watch('items') || [];
  const subTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );
  const taxableAmount = subTotal - totalDiscount;

  let totalCGST = 0, totalSGST = 0, totalIGST = 0, totalCess = 0;
  items.forEach((item) => {
    const amount = (item.quantity || 0) * (item.rate || 0) - (item.discount || 0);
    const gst = (amount * (item.gstRate || 0)) / 100;
    totalCGST += gst / 2;
    totalSGST += gst / 2;
    totalCess += (amount * (item.cessRate || 0)) / 100;
  });
  const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST + totalCess;

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setValue(`items.${index}.name`, product.name);
      setValue(`items.${index}.hsnCode`, product.hsnCode);
      setValue(`items.${index}.unit`, product.unit);
      setValue(`items.${index}.rate`, product.rate);
      setValue(`items.${index}.gstRate`, product.gstRate);
      setValue(`items.${index}.cessRate`, product.cessRate || 0);
    }
  };

  const onSubmit = async (data, status) => {
    setLoading(true);
    try {
      const response = await api.post('/invoices', data);
      if (status === 'ISSUED') {
        await api.post(`/invoices/${response.data.data._id}/issue`);
        toast.success('Invoice created and issued!');
      } else {
        toast.success('Invoice saved as draft');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);

  return (
    <form className="invoice-form">
      {/* Invoice Details */}
      <div className="invoice-form-section">
        <h3>Invoice Details</h3>
        <div className="invoice-form-row">
          <div className="form-group">
            <label className="label label-required">Client</label>
            <select
              {...register('clientId', { required: 'Client is required' })}
              className={`input-field${errors.clientId ? ' input-error' : ''}`}
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} {client.gstin ? `(${client.gstin})` : ''}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <span className="field-error">{errors.clientId.message}</span>
            )}
          </div>
          <div className="form-group">
            <label className="label label-required">Invoice Date</label>
            <input
              type="date"
              {...register('invoiceDate', { required: true })}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="label label-required">Due Date</label>
            <input
              type="date"
              {...register('dueDate', { required: true })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="invoice-form-section">
        <div className="card-header">
          <h3>Line Items</h3>
          <button
            type="button"
            onClick={() =>
              append({
                name: '',
                hsnCode: '',
                quantity: 1,
                unit: 'PCS',
                rate: 0,
                discount: 0,
                gstRate: 18,
                cessRate: 0,
              })
            }
            className="btn btn-secondary btn-sm"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="table-wrapper">
          <table className="line-items-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Product</th>
                <th style={{ minWidth: 100 }}>HSN/SAC</th>
                <th style={{ minWidth: 80 }}>Qty</th>
                <th style={{ minWidth: 90 }}>Rate</th>
                <th style={{ minWidth: 80 }}>Disc</th>
                <th style={{ minWidth: 90 }}>GST %</th>
                <th style={{ minWidth: 100 }}>Amount</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const item = items[index] || {};
                const amount =
                  (item.quantity || 0) * (item.rate || 0) - (item.discount || 0);
                return (
                  <tr key={field.id}>
                    <td>
                      <select
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        {...register(`items.${index}.name`, { required: true })}
                        className="input-field"
                        placeholder="Item name"
                        style={{ marginTop: 'var(--space-1)' }}
                      />
                    </td>
                    <td>
                      <input
                        {...register(`items.${index}.hsnCode`)}
                        className="input-field"
                        placeholder="HSN"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`)}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.rate`)}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.discount`)}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <select
                        {...register(`items.${index}.gstRate`)}
                        className="input-field"
                      >
                        {[0, 0.25, 3, 5, 12, 18, 28].map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="line-item-amount">
                        {formatCurrency(amount)}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="line-item-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary & Notes */}
      <div className="invoice-summary-grid">
        <div className="invoice-form-section">
          <h3>Notes & Terms</h3>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input-field"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="form-group">
            <label className="label">Terms & Conditions</label>
            <textarea {...register('terms')} rows={3} className="input-field" />
          </div>
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="reverseCharge"
              {...register('isReverseCharge')}
              className="checkbox"
            />
            <label htmlFor="reverseCharge" className="checkbox-label">
              Subject to Reverse Charge
            </label>
          </div>
        </div>

        <div className="invoice-form-section">
          <h3>Invoice Summary</h3>
          <div className="summary-row">
            <span className="summary-row-label">Sub Total</span>
            <span className="summary-row-value">
              {formatCurrency(subTotal)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Discount</span>
            <span className="summary-row-value">
              - {formatCurrency(totalDiscount)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Taxable Amount</span>
            <span className="summary-row-value">
              {formatCurrency(taxableAmount)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">CGST</span>
            <span className="summary-row-value">
              {formatCurrency(totalCGST)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">SGST</span>
            <span className="summary-row-value">
              {formatCurrency(totalSGST)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">IGST</span>
            <span className="summary-row-value">
              {formatCurrency(totalIGST)}
            </span>
          </div>
          {totalCess > 0 && (
            <div className="summary-row">
              <span className="summary-row-label">Cess</span>
              <span className="summary-row-value">
                {formatCurrency(totalCess)}
              </span>
            </div>
          )}
          <div className="summary-row total">
            <span className="summary-row-label">Grand Total</span>
            <span className="summary-row-value">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="summary-actions">
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, 'DRAFT'))}
              disabled={loading}
              className="btn btn-secondary"
            >
              <FileText size={18} /> Save Draft
            </button>
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, 'ISSUED'))}
              disabled={loading}
              className="btn btn-primary"
            >
              <Send size={18} /> Issue Invoice
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default InvoiceForm;