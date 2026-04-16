import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Queries ──────────────────────────────────────────────────────────────────

export const useOrders = (params = {}) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data.data;
    },
  });

export const useOrder = (orderId) =>
  useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${orderId}`);
      return data.data.order;
    },
    enabled: !!orderId,
  });

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/orders/dashboard');
      return data.data;
    },
    refetchInterval: 60_000, // auto-refresh every minute
  });

export const useGarmentPrices = () =>
  useQuery({
    queryKey: ['garmentPrices'],
    queryFn: async () => {
      const { data } = await api.get('/orders/garments/prices');
      return data.data.garments;
    },
    staleTime: Infinity,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderData) => {
      const { data } = await api.post('/orders', orderData);
      return data.data.order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Order ${order.orderId} created!`);
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status, note }) => {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status, note });
      return data.data.order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.orderId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Status updated to ${order.status}`);
    },
    onError: (err) => toast.error(err.message),
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      await api.delete(`/orders/${orderId}`);
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order deleted');
    },
    onError: (err) => toast.error(err.message),
  });
};
