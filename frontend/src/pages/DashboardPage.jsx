import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useOrders';
import StatusBadge from '../components/StatusBadge';
import { TrendingUp, ShoppingBag, IndianRupee, Clock, PlusCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

const STATUS_COLORS = {
  RECEIVED: '#06b6d4',
  PROCESSING: '#f59e0b',
  READY: '#10b981',
  DELIVERED: '#818cf8',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-sm" style={{ background: 'var(--bg-card)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data, isLoading, refetch, isFetching } = useDashboard();
  const navigate = useNavigate();

  const chartData = data
    ? Object.entries(data.ordersByStatus).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-secondary flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/orders/new')}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle size={14} />
            New Order
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-secondary)' }} />
              <div className="h-8 w-16 rounded" style={{ background: 'var(--bg-secondary)' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={data?.summary.totalOrders ?? 0}
              sub={`${data?.today.orders ?? 0} today`}
              color="#3b82f6"
            />
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${(data?.summary.totalRevenue ?? 0).toLocaleString('en-IN')}`}
              sub={`₹${(data?.today.revenue ?? 0).toLocaleString('en-IN')} today`}
              color="#10b981"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Order Value"
              value={`₹${Math.round(data?.summary.avgOrderValue ?? 0)}`}
              sub="per order"
              color="#f59e0b"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={(data?.ordersByStatus.RECEIVED ?? 0) + (data?.ordersByStatus.PROCESSING ?? 0)}
              sub="awaiting completion"
              color="#06b6d4"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Chart */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                ORDERS BY STATUS
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={36}>
                  <XAxis
                    dataKey="status"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent orders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  RECENT ORDERS
                </h3>
                <button
                  onClick={() => navigate('/orders')}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {data?.recentOrders?.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No orders yet. Create your first order!
                  </p>
                )}
                {data?.recentOrders?.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {order.customerName}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {order.orderId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status quick overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(data?.ordersByStatus ?? {}).map(([status, count]) => (
              <div
                key={status}
                onClick={() => navigate(`/orders?status=${status}`)}
                className="card p-4 cursor-pointer transition-all"
                style={{ borderColor: STATUS_COLORS[status] + '40' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = STATUS_COLORS[status] + '80'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = STATUS_COLORS[status] + '40'}
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span
                    className="text-2xl font-display font-semibold"
                    style={{ color: STATUS_COLORS[status] }}
                  >
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + '20' }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}
