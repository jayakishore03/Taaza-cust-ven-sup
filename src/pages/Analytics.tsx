import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

const Analytics = () => {
  const stats = [
    { label: 'Total Revenue', value: '₹2,45,680', change: '+18.2%', trend: 'up', period: 'vs last month' },
    { label: 'Total Orders', value: '3,542', change: '+12.5%', trend: 'up', period: 'vs last month' },
    { label: 'Avg Order Value', value: '₹693', change: '+5.8%', trend: 'up', period: 'vs last month' },
    { label: 'Customer Retention', value: '78%', change: '-2.1%', trend: 'down', period: 'vs last month' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 85000, orders: 1240 },
    { month: 'Feb', revenue: 92000, orders: 1380 },
    { month: 'Mar', revenue: 78000, orders: 1150 },
    { month: 'Apr', revenue: 105000, orders: 1520 },
    { month: 'May', revenue: 118000, orders: 1680 },
    { month: 'Jun', revenue: 134000, orders: 1920 },
  ];

  const topProducts = [
    { name: 'Chicken Breast', orders: 485, revenue: '₹28,450', trend: '+12%' },
    { name: 'Mutton Curry Cut', orders: 392, revenue: '₹45,680', trend: '+8%' },
    { name: 'Fish - Pomfret', orders: 348, revenue: '₹38,920', trend: '+15%' },
    { name: 'Chicken Legs', orders: 321, revenue: '₹18,560', trend: '+5%' },
    { name: 'Prawns', orders: 289, revenue: '₹34,870', trend: '+20%' },
  ];

  const peakHours = [
    { hour: '8-10 AM', orders: 145, percentage: 15 },
    { hour: '10-12 PM', orders: 298, percentage: 30 },
    { hour: '12-2 PM', orders: 186, percentage: 19 },
    { hour: '2-4 PM', orders: 124, percentage: 13 },
    { hour: '4-6 PM', orders: 95, percentage: 10 },
    { hour: '6-8 PM', orders: 242, percentage: 25 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor your business performance and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${
                stat.trend === 'up' ? 'from-green-600 to-green-800' : 'from-red-600 to-red-800'
              } rounded-lg flex items-center justify-center`}>
                {index === 0 && <DollarSign className="w-6 h-6 text-white" />}
                {index === 1 && <ShoppingBag className="w-6 h-6 text-white" />}
                {index === 2 && <TrendingUp className="w-6 h-6 text-white" />}
                {index === 3 && <Users className="w-6 h-6 text-white" />}
              </div>
              <div className={`flex items-center gap-1 ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">{stat.change}</span>
              </div>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.period}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue Trends</h2>
              <p className="text-sm text-gray-600">Monthly revenue and order volume</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="space-y-4">
            {revenueData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{data.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{data.orders} orders</span>
                    <span className="font-semibold text-gray-900">₹{(data.revenue / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-red-600 to-red-800 rounded-full transition-all"
                    style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Hours</h2>
          <div className="space-y-4">
            {peakHours.map((hour, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{hour.hour}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{hour.orders}</span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-orange-600 to-orange-800 rounded-full transition-all"
                    style={{ width: `${hour.percentage * 3.33}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
            <p className="text-sm text-gray-600">Best performing items this month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{product.name}</td>
                  <td className="py-4 px-4 text-gray-700">{product.orders}</td>
                  <td className="py-4 px-4 font-semibold text-green-600">{product.revenue}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4" />
                      {product.trend}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-800 rounded-full"
                          style={{ width: `${(product.orders / 500) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {Math.round((product.orders / 500) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
