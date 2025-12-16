import { Search, Mail, Phone, MapPin, ShoppingBag, TrendingUp, X, Package, Calendar } from 'lucide-react';
import { useState } from 'react';

const Customers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const customers = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 98765 43210',
      address: '123, MG Road, Bangalore',
      totalOrders: 45,
      totalSpent: '₹28,450',
      lastOrder: '2 hours ago',
      status: 'Active',
      joinedDate: 'Jan 2024',
      avgOrderValue: '₹632',
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43211',
      address: '456, Indiranagar, Bangalore',
      totalOrders: 38,
      totalSpent: '₹24,680',
      lastOrder: '1 day ago',
      status: 'Active',
      joinedDate: 'Feb 2024',
      avgOrderValue: '₹649',
    },
    {
      id: 3,
      name: 'Amit Patel',
      email: 'amit.patel@email.com',
      phone: '+91 98765 43212',
      address: '789, Koramangala, Bangalore',
      totalOrders: 52,
      totalSpent: '₹34,890',
      lastOrder: '5 hours ago',
      status: 'Active',
      joinedDate: 'Dec 2023',
      avgOrderValue: '₹671',
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      email: 'sneha.reddy@email.com',
      phone: '+91 98765 43213',
      address: '321, Whitefield, Bangalore',
      totalOrders: 28,
      totalSpent: '₹18,920',
      lastOrder: '3 days ago',
      status: 'Active',
      joinedDate: 'Mar 2024',
      avgOrderValue: '₹676',
    },
    {
      id: 5,
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      phone: '+91 98765 43214',
      address: '654, HSR Layout, Bangalore',
      totalOrders: 15,
      totalSpent: '₹9,450',
      lastOrder: '2 weeks ago',
      status: 'Inactive',
      joinedDate: 'Apr 2024',
      avgOrderValue: '₹630',
    },
  ];

  // Function to generate all orders for a customer
  const generateCustomerOrders = (totalOrders: number) => {
    const itemsList = [
      'Chicken Breast 2kg, Eggs 12pcs',
      'Mutton Curry Cut 1kg',
      'Fish - Pomfret 1.5kg',
      'Chicken Legs 1kg, Prawns 500g',
      'Chicken Boneless 1.5kg',
      'Fish - Pomfret 1kg, Eggs 12pcs',
      'Mutton Biryani Cut 800g',
      'Chicken Breast 2kg, Mutton Biryani Cut 800g',
      'Fish - Pomfret 1.5kg, Prawns 500g',
      'Chicken Legs 1kg',
      'Chicken Boneless 1.5kg, Mutton Biryani Cut 800g',
      'Mutton Curry Cut 1kg, Eggs 12pcs',
      'Fish - Pomfret 1kg',
      'Chicken Breast 2kg',
    ];
    
    const amounts = ['₹420', '₹580', '₹620', '₹680', '₹720', '₹750', '₹850', '₹950', '₹1,200', '₹1,580', '₹1,850', '₹1,980'];
    const statuses = ['Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'In Transit', 'Processing', 'Cancelled'];
    const payments = ['Paid', 'Paid', 'COD', 'Paid', 'COD'];
    
    const orders = [];
    const baseDate = new Date('2024-01-15');
    
    for (let i = 0; i < totalOrders; i++) {
      const orderDate = new Date(baseDate);
      orderDate.setDate(orderDate.getDate() - Math.floor(i / 2)); // Spread orders across days
      orderDate.setHours(8 + (i % 12), (i * 15) % 60, 0, 0);
      
      const day = orderDate.getDate().toString().padStart(2, '0');
      const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      const year = orderDate.getFullYear();
      const hours = orderDate.getHours();
      const minutes = orderDate.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      orders.push({
        id: `#ORD-${2431 - i}`,
        date: `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`,
        items: itemsList[i % itemsList.length],
        amount: amounts[i % amounts.length],
        status: statuses[i % statuses.length],
        payment: payments[i % payments.length],
      });
    }
    
    return orders.reverse(); // Show newest first
  };

  // Generate all orders for each customer based on their totalOrders
  const customerOrders: { [key: number]: Array<{
    id: string;
    date: string;
    items: string;
    amount: string;
    status: string;
    payment: string;
  }> } = {};
  
  customers.forEach((customer) => {
    customerOrders[customer.id] = generateCustomerOrders(customer.totalOrders);
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    searchQuery === '' ||
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">View and manage your customer base</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Customers', value: '1,234', change: '+24 this week', color: 'from-blue-600 to-blue-800' },
          { label: 'Active Customers', value: '892', change: '72% active rate', color: 'from-green-600 to-green-800' },
          { label: 'New This Month', value: '86', change: '+15% vs last month', color: 'from-red-600 to-red-800' },
          { label: 'Avg Order Value', value: '₹654', change: '+8% increase', color: 'from-orange-600 to-orange-800' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Location</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Total Orders</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Total Spent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Last Order</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No customers found</p>
                    <p className="text-sm mt-1">
                      {searchQuery ? 'Try adjusting your search criteria' : 'No customers available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">Member since {customer.joinedDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-700 flex items-start gap-1 max-w-xs">
                      <MapPin className="w-3 h-3 mt-0.5" />
                      {customer.address}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <ShoppingBag className="w-4 h-4" />
                      {customer.totalOrders}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-semibold text-green-600">{customer.totalSpent}</p>
                    <p className="text-xs text-gray-500">Avg: {customer.avgOrderValue}</p>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{customer.lastOrder}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedCustomer(customer.id)}
                      className="mx-auto block px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Customer Profile</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {customers
                .filter((c) => c.id === selectedCustomer)
                .map((customer) => (
                  <div key={customer.id} className="space-y-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">{customer.name}</h3>
                        <p className="text-gray-600 flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </p>
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </p>
                        <p className="text-gray-600 flex items-start gap-2 mt-1">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          {customer.address}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          customer.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{customer.totalOrders}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                        <p className="text-3xl font-bold text-green-600">{customer.totalSpent}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                        <p className="text-3xl font-bold text-gray-900">{customer.avgOrderValue}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Order Summary ({customer.totalOrders} orders)
                      </h4>
                      {customerOrders[selectedCustomer] && customerOrders[selectedCustomer].length > 0 ? (
                        <div className="overflow-x-auto max-h-[400px]">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                              <tr>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerOrders[selectedCustomer].map((order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{order.id}</td>
                                  <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{order.date}</td>
                                  <td className="py-3 px-4 text-sm text-gray-700 max-w-xs">{order.items}</td>
                                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{order.amount}</td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600">{order.payment}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No orders found for this customer</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Recent Activity
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-gray-600">Last order {customer.lastOrder}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-600">Member since {customer.joinedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              <button
                onClick={() => setSelectedCustomer(null)}
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

export default Customers;
