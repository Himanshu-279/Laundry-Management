import { Package, Cog, CheckCircle, Truck } from 'lucide-react';

const STATUS_CONFIG = {
  RECEIVED:   { icon: Package,      label: 'Received',   className: 'status-RECEIVED' },
  PROCESSING: { icon: Cog,          label: 'Processing', className: 'status-PROCESSING' },
  READY:      { icon: CheckCircle,  label: 'Ready',      className: 'status-READY' },
  DELIVERED:  { icon: Truck,        label: 'Delivered',  className: 'status-DELIVERED' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span className={`status-badge ${config.className}`}>
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
