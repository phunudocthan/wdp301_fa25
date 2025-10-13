import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import {
  Blocks,
  User,
  LogOut,
  ShoppingCart,
  Search,
  Menu,
  X
} from 'lucide-react';
import type { User as UserType } from '../types/user';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cart } = useCart();
  const isAdmin = user?.role === 'admin';

  const go = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Blocks className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Lego Store
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button type="button" onClick={() => go('/shop')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Products
            </button>
            <button type="button" onClick={() => go('/home/featured')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Featured
            </button>
            <button type="button" onClick={() => go('/home/popular')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Popular
            </button>
            <button type="button" onClick={() => go('/home/gaming')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Guides
            </button>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={() => go('/cart')}
              className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.items.length}
              </span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <img
                  src={user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                />
                <span className="hidden md:block font-medium">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('/profile')}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => go('/admin')}
                      className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Blocks className="h-4 w-4 mr-2" />
                      Admin dashboard
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-3 py-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button type="button" onClick={() => go('/shop')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Products
              </button>
              <button type="button" onClick={() => go('/home/featured')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Featured
              </button>
              <button type="button" onClick={() => go('/home/popular')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Popular
              </button>
              <button type="button" onClick={() => go('/home/gaming')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Guides
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => go('/admin')}
                  className="block w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md font-semibold"
                >
                  Admin dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
