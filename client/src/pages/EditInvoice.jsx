import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { ArrowLeft } from 'lucide-react';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Header title="Edit Invoice" />
      <div className="page-content">
        <div className="page-content-inner">
          <button
            onClick={() => navigate(`/invoices/${id}`)}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 16 }}
          >
            <ArrowLeft size={16} /> Back to Invoice
          </button>
          <div className="card">
            <h3>Edit Invoice #{id}</h3>
            <p style={{ color: 'var(--color-gray-500)', marginTop: 8 }}>
              Editing is only available for DRAFT invoices. Feature coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditInvoice;