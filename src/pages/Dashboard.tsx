import { TrendingUp, Package, Truck, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Orders Today',
      value: '248',
      change: '+12% vs yesterday',
      icon: Package,
      gradient: 'from-red-600 to-red-800',
    },
    {
      title: 'Active Deliveries',
      value: '34',
      change: '8 running late',
      icon: Truck,
      gradient: 'from-orange-600 to-orange-800',
    },
    {
      title: 'Total Revenue',
      value: '₹45,680',
      change: 'Rolling 30 days',
      icon: DollarSign,
      gradient: 'from-green-600 to-green-800',
    },
    {
      title: 'Active Customers',
      value: '1,234',
      change: '24 new this week',
      icon: Users,
      gradient: 'from-blue-600 to-blue-800',
    },
  ];

  const recentOrders = [
    { id: '#ORD-2431', customer: 'Rajesh Kumar', item: 'Chicken Breast 2kg', status: 'Delivered', amount: '₹580', time: '2 mins ago' },
    { id: '#ORD-2430', customer: 'Priya Sharma', item: 'Mutton Curry Cut 1kg', status: 'In Transit', amount: '₹850', time: '8 mins ago' },
    { id: '#ORD-2429', customer: 'Amit Patel', item: 'Fish - Pomfret 1.5kg', status: 'Processing', amount: '₹720', time: '15 mins ago' },
    { id: '#ORD-2428', customer: 'Sneha Reddy', item: 'Chicken Legs 1kg', status: 'Delivered', amount: '₹320', time: '22 mins ago' },
  ];

  const topAgents = [
    { name: 'Ravi Verma', deliveries: 38, rating: 4.9, status: 'Active' },
    { name: 'Suresh Kumar', deliveries: 34, rating: 4.8, status: 'Active' },
    { name: 'Manjeet Singh', deliveries: 31, rating: 4.7, status: 'On Break' },
    { name: 'Arjun Das', deliveries: 28, rating: 4.9, status: 'Active' },
  ];

  // Data for bar chart - Orders by day of week
  const ordersByDay = [
    { day: 'Mon', orders: 320, revenue: 156800 },
    { day: 'Tue', orders: 285, revenue: 139650 },
    { day: 'Wed', orders: 310, revenue: 151900 },
    { day: 'Thu', orders: 298, revenue: 146020 },
    { day: 'Fri', orders: 342, revenue: 167580 },
    { day: 'Sat', orders: 368, revenue: 180320 },
    { day: 'Sun', orders: 335, revenue: 164150 },
  ];

  // Data for pie chart - Orders by status
  const ordersByStatus = [
    { name: 'Delivered', value: 1250, color: '#10b981' },
    { name: 'In Transit', value: 85, color: '#3b82f6' },
    { name: 'Processing', value: 145, color: '#f59e0b' },
    { name: 'Cancelled', value: 45, color: '#ef4444' },
  ];

  const COLORS = ordersByStatus.map((item) => item.color);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart - Orders by Day */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Orders by Day (This Week)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar 
                dataKey="orders" 
                fill="#dc2626" 
                radius={[8, 8, 0, 0]}
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`${value} orders`, 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {ordersByStatus.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{order.customer}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{order.item}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status === 'Delivered' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : order.status === 'In Transit' ? (
                          <Truck className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900 text-right">{order.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Delivery Agents</h2>
          <div className="space-y-4">
            {topAgents.map((agent, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.deliveries} deliveries • ⭐ {agent.rating}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
