import { Search, UserPlus, Phone, MapPin, TrendingUp, Star, X, Mail, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

const DeliveryAgents = () => {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    location: '',
    status: 'Active',
  });

  const agents = [
    {
      id: 1,
      name: 'Ravi Verma',
      phone: '+91 98765 11111',
      status: 'Active',
      currentLocation: 'Indiranagar, Bangalore',
      deliveriesToday: 12,
      totalDeliveries: 342,
      rating: 4.9,
      earnings: '₹1,240',
      joinedDate: 'Jan 2024',
    },
    {
      id: 2,
      name: 'Suresh Kumar',
      phone: '+91 98765 22222',
      status: 'Active',
      currentLocation: 'Koramangala, Bangalore',
      deliveriesToday: 10,
      totalDeliveries: 298,
      rating: 4.8,
      earnings: '₹1,080',
      joinedDate: 'Feb 2024',
    },
    {
      id: 3,
      name: 'Manjeet Singh',
      phone: '+91 98765 33333',
      status: 'On Break',
      currentLocation: 'Whitefield, Bangalore',
      deliveriesToday: 8,
      totalDeliveries: 276,
      rating: 4.7,
      earnings: '₹920',
      joinedDate: 'Dec 2023',
    },
    {
      id: 4,
      name: 'Arjun Das',
      phone: '+91 98765 44444',
      status: 'Active',
      currentLocation: 'HSR Layout, Bangalore',
      deliveriesToday: 9,
      totalDeliveries: 254,
      rating: 4.9,
      earnings: '₹1,150',
      joinedDate: 'Mar 2024',
    },
    {
      id: 5,
      name: 'Kiran Reddy',
      phone: '+91 98765 55555',
      status: 'Offline',
      currentLocation: 'Jayanagar, Bangalore',
      deliveriesToday: 0,
      totalDeliveries: 189,
      rating: 4.6,
      earnings: '₹0',
      joinedDate: 'Apr 2024',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'On Break':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Offline':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Agents</h1>
        <p className="text-gray-600">Manage and monitor your delivery team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Agents', value: '24', color: 'from-red-600 to-red-800' },
          { label: 'Active Now', value: '18', color: 'from-green-600 to-green-800' },
          { label: 'On Break', value: '4', color: 'from-yellow-600 to-yellow-800' },
          { label: 'Offline', value: '2', color: 'from-gray-600 to-gray-800' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <div className={`h-2 bg-gradient-to-r ${stat.color} rounded-full mt-4`}></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, location..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Add New Agent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {agent.phone}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {agent.currentLocation}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}
              >
                {agent.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{agent.deliveriesToday}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{agent.totalDeliveries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rating</p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {agent.rating}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Earnings</p>
                <p className="text-xl font-bold text-green-600">{agent.earnings}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedAgent(agent.id)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View Details
              </button>
              <button
                onClick={() => window.open(`tel:${agent.phone}`)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium"
              >
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Agent Details</h2>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {agents
                .filter((a) => a.id === selectedAgent)
                .map((agent) => (
                  <div key={agent.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{agent.name}</h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getStatusColor(
                            agent.status
                          )}`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Contact Information</h3>
                        <p className="text-sm text-gray-900 flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {agent.phone}
                        </p>
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {agent.currentLocation}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Joining Information</h3>
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          Joined: {agent.joinedDate}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-600 mb-4">Performance Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Today's Deliveries</p>
                          <p className="text-2xl font-bold text-gray-900">{agent.deliveriesToday}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
                          <p className="text-2xl font-bold text-gray-900">{agent.totalDeliveries}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Rating</p>
                          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            {agent.rating}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Today's Earnings</p>
                          <p className="text-2xl font-bold text-green-600">{agent.earnings}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => window.open(`tel:${agent.phone}`)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Call Agent
                      </button>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Agent</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAgent({ name: '', phone: '', location: '', status: 'Active' });
                  }}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="Enter agent name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newAgent.location}
                    onChange={(e) => setNewAgent({ ...newAgent, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={newAgent.status}
                    onChange={(e) => setNewAgent({ ...newAgent, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Break">On Break</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (newAgent.name && newAgent.phone && newAgent.location) {
                      // Here you would typically add the agent to your database/state
                      alert(`Agent ${newAgent.name} added successfully!`);
                      setShowAddModal(false);
                      setNewAgent({ name: '', phone: '', location: '', status: 'Active' });
                    } else {
                      alert('Please fill in all fields');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium"
                >
                  Add Agent
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAgent({ name: '', phone: '', location: '', status: 'Active' });
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAgents;
