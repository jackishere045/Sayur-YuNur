import React from 'react';
import { Home, ShoppingCart, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { id: 'home', icon: Home, label: 'Beranda', route: '/' },
    { id: 'cart', icon: ShoppingCart, label: 'Keranjang', badge: cartItemCount, route: '/cart' },
    { id: 'orders', icon: Package, label: 'Pesanan', route: '/orders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-padding">
      <div className="flex">
        {navItems.map(({ id, icon: Icon, label, badge, route }) => (
          <button
            key={id}
            onClick={() => navigate(route)}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center relative transition-colors ${
              location.pathname === route
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="relative">
              <Icon size={24} />
              {badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium min-w-[20px]">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
