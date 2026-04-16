import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useUpdateStatus, useDeleteOrder } from '../hooks/useOrders';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Calendar, Phone, User, Clock, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const NEXT_STATUS = { RECEIVED: 'PROCESSING', PROCESSING: 'READY', READY: 'DELIVERED' };
const STATUS_ORDER = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: order, isLoading, error } = useOrder(orderId);
  const updateStatus = useUpdateStatus();
  const deleteOrder = useDeleteOrder();

  const handleAdvance = () => {
    const next = NEXT_STATUS[order.status];
    if (next) updateStatus.mutate({ orderId: order.orderId, status: next });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete order ${orderId}?`)) {
      deleteOrder.mutate(orderId, { onSuccess: () => navigate('/orders') });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Order not found.</p>
        <button onClick={() => navigate('/orders')} className="btn-primary">Back to Orders</button>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];
  const currentStep = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Order Details
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="font-mono text-sm mt-0.5" style={{ color: 'var(--accent)' }}>
              {order.orderId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={handleAdvance}
              className="btn-primary flex items-center gap-2"
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              Mark {nextStatus}
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="btn-secondary flex items-center gap-1.5 text-red-400 border-red-900"
              disabled={deleteOrder.isPending}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-5">
        <div className="flex items-center">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i <= currentStep ? 'var(--accent)' : 'var(--bg-secondary)',
                    border: `2px solid ${i <= currentStep ? 'var(--accent)' : 'var(--border)'}`,
                    color: i <= currentStep ? 'white' : 'var(--text-muted)',
                    boxShadow: i === currentStep ? '0 0 16px var(--accent-glow)' : 'none',
                  }}
                >
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <p className="text-xs mt-1.5 font-medium" style={{ color: i <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s}
                </p>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-5 transition-all"
                  style={{ background: i < currentStep ? 'var(--accent)' : 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Customer
          </h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Name" value={order.customerName} />
            <InfoRow icon={Phone} label="Phone" value={order.phoneNumber} mono />
            <InfoRow icon={Calendar} label="Created" value={format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')} />
            <InfoRow
              icon={Clock}
              label="Est. Delivery"
              value={format(new Date(order.estimatedDeliveryDate), 'dd MMM yyyy')}
            />
          </div>
          {order.notes && (
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Bill */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text-muted)' }}>
            Bill Summary
          </h3>
          <div className="space-y-2">
            {order.garments.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {g.garmentType} × {g.quantity}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                    @ ₹{g.pricePerItem}
                  </span>
                </span>
                <span style={{ color: 'var(--text-primary)' }}>₹{g.subtotal}</span>
              </div>
            ))}
          </div>
          <div className="glow-line my-3" />
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total</span>
            <span className="text-2xl font-display font-bold" style={{ color: 'var(--accent)' }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text-muted)' }}>
          Status History
        </h3>
        <div className="space-y-3">
          {[...order.statusHistory].reverse().map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2 shrink-0"
                style={{ background: i === 0 ? 'var(--accent)' : 'var(--text-muted)' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} size="sm" />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    by {h.changedBy}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(h.changedAt), 'dd MMM yyyy, HH:mm')}
                </p>
                {h.note && (
                  <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>
                    "{h.note}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}
