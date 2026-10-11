import React, { useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const ProductPicker = ({ products, loading, onAdd }) => {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hsnCode.toLowerCase().includes(q)
    );
  }, [search, products]);

  return (
    <div className="product-picker">
      <div className="product-picker-search">
        <Search size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or HSN..."
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="cart-empty" style={{ padding: 40 }}>
          <Package size={40} />
          <p>No products found</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <button
              key={product._id}
              type="button"
              onClick={() => onAdd(product)}
              className="product-card"
              disabled={product.stock <= 0}
            >
              <p className="product-card-name">{product.name}</p>
              <div className="product-card-meta">
                <span className="product-card-price">
                  {formatCurrency(product.rate, false)}
                </span>
                <span className="product-card-gst">{product.gstRate}%</span>
              </div>
              <span
                className={`product-card-stock${
                  product.stock <= 5 ? ' low' : ''
                }`}
              >
                Stock: {product.stock} {product.unit}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductPicker;