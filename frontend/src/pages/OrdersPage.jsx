import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders, useUpdateStatus, useDeleteOrder } from '../hooks/useOrders';
import StatusBadge from '../components/StatusBadge';
import { Search, PlusCircle, ChevronLeft, ChevronRight, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
const NEXT_STATUS = { RECEIVED: 'PROCESSING', PROCESSING: 'READY', READY: 'DELIVERED' };

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const params = {
    ...(status && { status }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 15,
  };

  const { data, isLoading } = useOrders(params);
  const updateStatus = useUpdateStatus();
  const deleteOrder = useDeleteOrder();

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? {};

  const handleAdvance = (e, order) => {
    e.stopPropagation();
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    updateStatus.mutate({ orderId: order.orderId, status: next });
  };

  const handleDelete = (e, orderId) => {
    e.stopPropagation();
    if (window.confirm(`Delete order ${orderId}? This cannot be undone.`)) {
      deleteOrder.mutate(orderId);
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Orders
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {pagination.total ?? 0} orders total
          </p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary flex items-center gap-2">
          <PlusCircle size={14} /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, phone, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setSearchParams(s ? { status: s } : {}); }}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: status === s ? 'var(--accent)' : 'transparent',
                color: status === s ? 'white' : 'var(--text-secondary)',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order ID', 'Customer', 'Phone', 'Garments', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)', width: `${60 + j * 8}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No orders found.{' '}
                    <button onClick={() => navigate('/orders/new')} style={{ color: 'var(--accent)' }}>
                      Create one?
                    </button>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        {order.orderId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {order.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {order.garments.length} item{order.garments.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(order.createdAt), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={(e) => handleAdvance(e, order)}
                            className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                            disabled={updateStatus.isPending}
                            title={`Move to ${NEXT_STATUS[order.status]}`}
                          >
                            <ArrowRight size={11} />
                            {NEXT_STATUS[order.status]}
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => handleDelete(e, order.orderId)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded transition-colors disabled:opacity-40"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded transition-colors disabled:opacity-40"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
