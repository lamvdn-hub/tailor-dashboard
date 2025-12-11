import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, MapPin, Phone, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';
import { ThemeToggle } from '../components/ThemeToggle';

interface OrderStatusData {
  display_id: string;
  customer_name: string;
  service_type: string;
  garment_type: string;
  status: string;
  created_at: string;
}

const SHOP_INFO = {
  name: 'Clearmind Tailor',
  address: '123 Savile Row, London W1S 3PR',
  phone: '+49 12 3456 789',
  email: 'info@clearai.com',
  hours: 'Mon-Fri: 9am-6pm, Sat: 10am-4pm',
  mapsUrl: 'https://maps.google.com/?q=Savile+Row+London',
};

function getStatusSteps(serviceType: string) {
  const normalizedType = serviceType?.toLowerCase().trim() || 'mtm';

  if (normalizedType === 'bespoke') {
    return [
      { key: 'active', label: 'Order Received' },
      { key: 'fitting_1', label: 'First Fitting' },
      { key: 'fitting_2', label: 'Second Fitting' },
      { key: 'pickup', label: 'Ready for Pickup' },
      { key: 'completed', label: 'Completed' },
    ];
  }

  return [
    { key: 'active', label: 'Order Received' },
    { key: 'fitting', label: 'Fitting' },
    { key: 'pickup', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Completed' },
  ];
}

function getStepIndex(status: string, steps: { key: string; label: string }[]) {
  const index = steps.findIndex(step => step.key === status);
  return index >= 0 ? index : 0;
}

function StatusTimeline({ status, serviceType }: { status: string; serviceType: string }) {
  const steps = getStatusSteps(serviceType);
  const currentIndex = getStepIndex(status, steps);
  const isOrderCompleted = status === 'completed';

  return (
    <div className="py-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = isOrderCompleted || index < currentIndex;
            const isCurrent = !isOrderCompleted && index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step.key} className="relative flex items-center gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                      ? 'bg-[#506B4D] dark:bg-[#7ba76a] ring-4 ring-[#506B4D]/20 dark:ring-[#7ba76a]/20'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>

                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-[#506B4D] dark:text-[#7ba76a] font-medium">In Progress</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShopInfoCard() {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#506B4D] dark:text-[#7ba76a]" />
        Pickup Information
      </h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{SHOP_INFO.name}</p>
          <p className="text-gray-600 dark:text-gray-300">{SHOP_INFO.address}</p>
        </div>

        <a
          href={SHOP_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#506B4D] dark:text-[#7ba76a] hover:underline"
        >
          View on Google Maps
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-300 mb-2">{SHOP_INFO.hours}</p>

          <div className="flex flex-col gap-2">
            <a
              href={`tel:${SHOP_INFO.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-[#506B4D] dark:hover:text-[#7ba76a]"
            >
              <Phone className="w-4 h-4" />
              {SHOP_INFO.phone}
            </a>

            <a
              href={`mailto:${SHOP_INFO.email}`}
              className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-[#506B4D] dark:hover:text-[#7ba76a]"
            >
              <Mail className="w-4 h-4" />
              {SHOP_INFO.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-3 border-gray-200 dark:border-gray-700 border-t-[#506B4D] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading order status...</p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Order Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The tracking link you're using may be invalid or expired. Please contact the shop if you need assistance.
        </p>
        <ShopInfoCard />
      </div>
    </div>
  );
}

export function OrderStatus() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<OrderStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchOrderStatus() {
      if (!token) {
        setError(true);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          display_id,
          service_type,
          garment_type,
          status,
          created_at,
          client:clients(first_name, last_name, name)
        `)
        .eq('status_token', token)
        .maybeSingle();

      if (fetchError || !data) {
        setError(true);
        setLoading(false);
        return;
      }

      const client = data.client as { first_name?: string; last_name?: string; name?: string } | null;
      const customerName = client?.first_name && client?.last_name
        ? `${client.first_name} ${client.last_name.charAt(0)}.`
        : client?.name?.split(' ')[0] || 'Customer';

      setOrder({
        display_id: data.display_id || 'N/A',
        customer_name: customerName,
        service_type: data.service_type || 'MTM',
        garment_type: data.garment_type,
        status: data.status,
        created_at: data.created_at,
      });
      setLoading(false);
    }

    fetchOrderStatus();
  }, [token]);

  if (loading) return <LoadingState />;
  if (error || !order) return <ErrorState />;

  const statusLabel = order.status === 'active' ? 'In Progress'
    : order.status === 'fitting_1' ? 'First Fitting'
    : order.status === 'fitting_2' ? 'Second Fitting'
    : order.status === 'fitting' ? 'Fitting'
    : order.status === 'pickup' ? 'Ready for Pickup'
    : order.status === 'completed' ? 'Completed'
    : 'In Progress';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-[#506B4D] dark:text-[#7ba76a]">
            [Name]
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#506B4D] dark:bg-[#3a4f37] px-6 py-8 text-center text-white">
            <p className="text-sm opacity-80 mb-1">Order Number</p>
            <h1 className="text-3xl font-bold tracking-wide">#{order.display_id}</h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.service_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Garment</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{order.garment_type}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : order.status === 'pickup'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-[#506B4D]/10 dark:bg-[#506B4D]/20 text-[#506B4D] dark:text-[#7ba76a]'
                }`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Order Progress</h2>
              <StatusTimeline status={order.status} serviceType={order.service_type} />
            </div>

            <ShopInfoCard />
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Questions about your order? Contact us anytime.
        </p>
      </main>
    </div>
  );
}
