import { Search, Filter, Download, Eye, MapPin, Phone, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const allOrders = [
    {
      id: '#ORD-2431',
      customer: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      address: '123, MG Road, Bangalore',
      items: 'Chicken Breast 2kg, Eggs 12pcs',
      amount: '₹850',
      status: 'Delivered',
      agent: 'Ravi Verma',
      orderTime: '10:30 AM',
      deliveryTime: '11:45 AM',
      payment: 'Paid',
    },
    {
      id: '#ORD-2430',
      customer: 'Priya Sharma',
      phone: '+91 98765 43211',
      address: '456, Indiranagar, Bangalore',
      items: 'Mutton Curry Cut 1kg',
      amount: '₹1,200',
      status: 'In Transit',
      agent: 'Suresh Kumar',
      orderTime: '10:45 AM',
      deliveryTime: '12:00 PM',
      payment: 'Paid',
    },
    {
      id: '#ORD-2429',
      customer: 'Amit Patel',
      phone: '+91 98765 43212',
      address: '789, Koramangala, Bangalore',
      items: 'Fish - Pomfret 1.5kg, Prawns 500g',
      amount: '₹1,850',
      status: 'Processing',
      agent: 'Manjeet Singh',
      orderTime: '11:00 AM',
      deliveryTime: '12:30 PM',
      payment: 'COD',
    },
    {
      id: '#ORD-2428',
      customer: 'Sneha Reddy',
      phone: '+91 98765 43213',
      address: '321, Whitefield, Bangalore',
      items: 'Chicken Legs 1kg',
      amount: '₹420',
      status: 'Delivered',
      agent: 'Arjun Das',
      orderTime: '09:30 AM',
      deliveryTime: '10:45 AM',
      payment: 'Paid',
    },
    {
      id: '#ORD-2427',
      customer: 'Vikram Singh',
      phone: '+91 98765 43214',
      address: '654, HSR Layout, Bangalore',
      items: 'Chicken Boneless 1.5kg, Mutton Biryani Cut 800g',
      amount: '₹1,980',
      status: 'Cancelled',
      agent: '-',
      orderTime: '08:45 AM',
      deliveryTime: '-',
      payment: 'Refunded',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Filter orders based on search and status
  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.items.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items', 'Amount', 'Status', 'Delivery Agent', 'Order Time', 'Delivery Time', 'Payment'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map((order) =>
        [
          order.id,
          `"${order.customer}"`,
          order.phone,
          `"${order.items}"`,
          order.amount,
          order.status,
          order.agent,
          order.orderTime,
          order.deliveryTime || '-',
          order.payment,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusOptions = ['all', 'Delivered', 'In Transit', 'Processing', 'Cancelled'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p className="text-gray-600">Track and manage all customer orders</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                  statusFilter !== 'all' ? 'bg-red-50 border-red-300 text-red-700' : ''
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filter</span>
                {statusFilter !== 'all' && (
                  <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                    {statusFilter}
                  </span>
                )}
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-800">
                    <h3 className="text-white font-semibold">Filter by Status</h3>
                  </div>
                  <div className="py-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilter(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          statusFilter === status ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {status === 'all' ? 'All Orders' : status}
                      </button>
                    ))}
                  </div>
                  {statusFilter !== 'all' && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setShowFilter(false);
                        }}
                        className="w-full text-sm text-red-600 hover:text-red-700 font-medium text-center"
                      >
                        Clear Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Items</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Delivery Agent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Time</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm mt-1">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria'
                        : 'No orders available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">{order.id}</td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.phone}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700 max-w-xs truncate">{order.items}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">{order.amount}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">{order.agent}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{order.orderTime}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedOrder(order.id)}
                      className="mx-auto flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-red-100">{selectedOrder}</p>
            </div>
            <div className="p-6">
              {allOrders
                .filter((o) => o.id === selectedOrder)
                .map((order) => (
                  <div key={order.id} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Customer Information</h3>
                        <p className="text-lg font-bold text-gray-900">{order.customer}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                          <Phone className="w-4 h-4" />
                          {order.phone}
                        </p>
                        <p className="text-sm text-gray-600 flex items-start gap-2 mt-2">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          {order.address}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h3>
                        <span
                          className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-4">
                          <span className="font-medium">Payment:</span> {order.payment}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Items</h3>
                      <p className="text-gray-900">{order.items}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Delivery Agent</h3>
                        <p className="text-gray-900 font-medium">{order.agent}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Timeline</h3>
                        <p className="text-sm text-gray-600">Ordered: {order.orderTime}</p>
                        <p className="text-sm text-gray-600">Delivered: {order.deliveryTime}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900">{order.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
