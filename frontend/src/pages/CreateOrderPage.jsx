import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder, useGarmentPrices } from '../hooks/useOrders';
import { Plus, Trash2, Loader2, ArrowLeft, IndianRupee } from 'lucide-react';

const emptyGarment = () => ({ garmentType: '', quantity: 1, pricePerItem: '' });

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const { data: garmentPrices } = useGarmentPrices();

  const [form, setForm] = useState({ customerName: '', phoneNumber: '', notes: '' });
  const [garments, setGarments] = useState([emptyGarment()]);
  const [errors, setErrors] = useState({});

  const garmentOptions = garmentPrices ? Object.keys(garmentPrices) : [];

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Required';
    if (!/^[6-9]\d{9}$/.test(form.phoneNumber)) e.phoneNumber = 'Enter valid 10-digit number';
    garments.forEach((g, i) => {
      if (!g.garmentType) e[`garment_${i}_type`] = 'Required';
      if (!g.quantity || g.quantity < 1) e[`garment_${i}_qty`] = 'Min 1';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGarmentTypeChange = (index, type) => {
    setGarments((prev) => {
      const updated = [...prev];
      const price = garmentPrices?.[type]?.price || '';
      updated[index] = { ...updated[index], garmentType: type, pricePerItem: price };
      return updated;
    });
  };

  const handleGarmentChange = (index, field, value) => {
    setGarments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGarment = () => setGarments((prev) => [...prev, emptyGarment()]);
  const removeGarment = (i) => setGarments((prev) => prev.filter((_, idx) => idx !== i));

  const totalAmount = garments.reduce((sum, g) => {
    const price = parseFloat(g.pricePerItem) || 0;
    const qty = parseInt(g.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      garments: garments.map((g) => ({
        garmentType: g.garmentType,
        quantity: parseInt(g.quantity),
        ...(g.pricePerItem !== '' && { pricePerItem: parseFloat(g.pricePerItem) }),
      })),
    };

    const order = await createOrder.mutateAsync(payload);
    navigate(`/orders/${order.orderId}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            New Order
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in customer and garment details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Customer Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input
                type="text"
                className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              />
              {errors.customerName && <p className="text-xs text-red-400 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                className={`input-field ${errors.phoneNumber ? 'border-red-500' : ''}`}
                placeholder="10-digit mobile"
                maxLength={10}
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value.replace(/\D/, '') }))}
              />
              {errors.phoneNumber && <p className="text-xs text-red-400 mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Special instructions, stains to note, etc."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Garments */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Garments
            </h3>
            <button
              type="button"
              onClick={addGarment}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-1">
            {['Type', 'Qty', 'Price/Item', ''].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-medium uppercase tracking-wide ${i === 0 ? 'col-span-5' : i === 3 ? 'col-span-1' : 'col-span-3'}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {garments.map((g, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <select
                    className={`input-field ${errors[`garment_${i}_type`] ? 'border-red-500' : ''}`}
                    value={g.garmentType}
                    onChange={(e) => handleGarmentTypeChange(i, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {garmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {garmentPrices[opt].name}
                      </option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={1}
                    className={`input-field ${errors[`garment_${i}_qty`] ? 'border-red-500' : ''}`}
                    placeholder="1"
                    value={g.quantity}
                    onChange={(e) => handleGarmentChange(i, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-field"
                    placeholder="Auto"
                    value={g.pricePerItem}
                    onChange={(e) => handleGarmentChange(i, 'pricePerItem', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-center pt-1">
                  {garments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGarment(i)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Price preview */}
          {garments.some((g) => g.garmentType && g.quantity) && (
            <div
              className="rounded-lg p-3 space-y-1.5 mt-2"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              {garments.filter((g) => g.garmentType && g.quantity).map((g, i) => {
                const price = parseFloat(g.pricePerItem) || 0;
                const qty = parseInt(g.quantity) || 0;
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {garmentPrices?.[g.garmentType]?.name || g.garmentType} × {qty}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{(price * qty).toFixed(0)}</span>
                  </div>
                );
              })}
              <div className="glow-line my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total
                </span>
                <span className="text-lg font-display font-semibold" style={{ color: 'var(--accent)' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Creating...</>
            ) : (
              <><IndianRupee size={14} /> Create Order</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
