import { Bell, LogOut, User, Settings, ChevronDown, Package, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Header = ({ onLogout, onNavigate }: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #ORD-2432 from Priya Sharma',
      time: '5 mins ago',
      type: 'order',
      read: false,
    },
    {
      id: 2,
      title: 'Delivery Completed',
      message: 'Order #ORD-2431 delivered successfully',
      time: '15 mins ago',
      type: 'delivery',
      read: false,
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'Payment of ₹1,250 received for Order #ORD-2430',
      time: '1 hour ago',
      type: 'payment',
      read: true,
    },
    {
      id: 4,
      title: 'Agent Alert',
      message: 'Delivery agent Ravi Verma is running late',
      time: '2 hours ago',
      type: 'alert',
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 relative z-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-gray-800 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500">Manage your meat delivery operations</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-white text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'order'
                                ? 'bg-blue-100 text-blue-600'
                                : notification.type === 'delivery'
                                ? 'bg-green-100 text-green-600'
                                : notification.type === 'payment'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            {notification.type === 'order' ? (
                              <Package className="w-5 h-5" />
                            ) : notification.type === 'delivery' ? (
                              <Truck className="w-5 h-5" />
                            ) : notification.type === 'alert' ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button className="w-full text-sm text-red-600 hover:text-red-700 font-medium text-center">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Admin User</p>
                      <p className="text-red-100 text-xs">Super Admin</p>
                    </div>
                  </div>
                </div>
                <div className="py-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfile(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfile(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
