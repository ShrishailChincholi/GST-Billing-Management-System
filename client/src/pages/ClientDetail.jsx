import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { ArrowLeft } from 'lucide-react';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Header title="Client Details" />
      <div className="page-content">
        <div className="page-content-inner">
          <button
            onClick={() => navigate('/clients')}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 16 }}
          >
            <ArrowLeft size={16} /> Back to Clients
          </button>
          <div className="card">
            <h3>Client ID: {id}</h3>
            <p style={{ color: 'var(--color-gray-500)', marginTop: 8 }}>
              Detailed view coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDetail;