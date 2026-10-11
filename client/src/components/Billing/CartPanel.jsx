import React from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CartPanel = ({
  cart,
  onUpdateQuantity,
  onRemove,
  onClear,
}) => {
  return (
    <div className="cart-panel">
      <div className="cart-header">
        <h3>
          <ShoppingCart size={18} />
          Cart
          {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        </h3>
        {cart.length > 0 && (
          <button onClick={onClear} className="cart-clear-btn">
            Clear all
          </button>
        )}
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={40} />
            <p>Cart is empty. Add products from the left.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">
                  {formatCurrency(item.rate, false)} × {item.quantity} ={' '}
                  {formatCurrency(item.rate * item.quantity, false)}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQuantity(item._id, item.quantity - 1)
                      }
                      className="qty-btn"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQuantity(item._id, item.quantity + 1)
                      }
                      className="qty-btn"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <div className="cart-item-total">
                  {formatCurrency(
                    item.rate * item.quantity - (item.discount || 0),
                    false
                  )}
                </div>
                <button
                  onClick={() => onRemove(item._id)}
                  className="cart-item-remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CartPanel;