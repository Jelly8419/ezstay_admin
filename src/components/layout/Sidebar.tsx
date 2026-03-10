import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Home,
  Calendar,
  CreditCard,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: '대시보드',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    path: '/users',
    label: '유저 관리',
    icon: <Users className="w-5 h-5" />
  },
  {
    path: '/rooms',
    label: '방 관리',
    icon: <Home className="w-5 h-5" />,
    children: [
      { path: '/rooms', label: '방 목록' },
      { path: '/rooms/review', label: '방 심사' }
    ]
  },
  {
    path: '/contracts',
    label: '계약 관리',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    path: '/payments',
    label: '결제 관리',
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    path: '/settlements',
    label: '정산 관리',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    path: '/deposit-holds',
    label: '보증금 보류',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    path: '/receipts',
    label: '영수증 관리',
    icon: <Receipt className="w-5 h-5" />
  },
  {
    path: '/support',
    label: '고객센터',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    path: '/notifications',
    label: '알림 서비스',
    icon: <Bell className="w-5 h-5" />
  },
  {
    path: '/admin/action-logs',
    label: '관리자 액션 로그',
    icon: <FileText className="w-5 h-5" />
  }
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">EZStay 관리자</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>

            {/* Sub-menu */}
            {item.children && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-800">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">설정</span>
        </NavLink>
      </div>
    </aside>
  );
};
