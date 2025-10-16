import React from 'react';
import { Link } from 'react-router-dom';

const sidebarLinks = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Quản lý sản phẩm', to: '/admin/products' },
  { label: 'Quản lý danh mục', to: '/admin/categories' },
  { label: 'Quản lý voucher', to: '/admin/vouchers' },
  { label: 'Quản lý thông báo', to: '/admin/notifications' },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 h-full bg-gray-100 border-r flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">Admin Menu</h2>
      <nav>
        <ul className="space-y-4">
          {sidebarLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} className="text-gray-700 hover:text-blue-600 font-medium">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
