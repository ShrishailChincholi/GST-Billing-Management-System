import React from 'react';
import Header from '../components/Layout/Header';
import InvoiceForm from '../components/Invoice/InvoiceForm';

const CreateInvoice = () => {
  return (
    <>
      <Header title="Create Invoice" />
      <div className="page-content">
        <div className="page-content-inner">
          <InvoiceForm />
        </div>
      </div>
    </>
  );
};

export default CreateInvoice;