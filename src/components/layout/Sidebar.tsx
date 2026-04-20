import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  Home,
  Calendar,
  CreditCard,
  DollarSign,
  Banknote,
  MessageSquare,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  Receipt,
  Send,
  Package,
  ClipboardList,
  Gift,
  ChevronDown,
  ChevronRight,
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
    icon: <Calendar className="w-5 h-5" />,
    children: [
      { path: '/contracts', label: '계약 목록' },
      { path: '/contracts/deposits', label: '보증금 관리' },
      { path: '/contracts/cancel-requests', label: '취소 요청 관리' },
    ]
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
    path: '/payouts',
    label: '지급 관리',
    icon: <Banknote className="w-5 h-5" />
  },
  {
    path: '/rental-orders',
    label: '옵션상품 관리',
    icon: <Package className="w-5 h-5" />,
    children: [
      { path: '/rental-orders',          label: '배송 상태 관리' },
      { path: '/rental-refund-requests', label: '환불 요청 관리' },
      { path: '/rental-items',           label: '재고 관리' },
    ]
  },
  {
    path: '/service-tasks',
    label: '예약 관리',
    icon: <ClipboardList className="w-5 h-5" />
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
    path: '/alimtalk',
    label: '알림톡 관리',
    icon: <Send className="w-5 h-5" />,
    children: [
      { path: '/alimtalk',       label: '알림톡 관리' },
      { path: '/alimtalk/queue', label: '알림 큐 현황' },
    ]
  },
  {
    path: '/promotions',
    label: '프로모션 관리',
    icon: <Gift className="w-5 h-5" />
  },
  {
    path: '/admin/action-logs',
    label: '관리자 액션 로그',
    icon: <FileText className="w-5 h-5" />
  }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  // 현재 경로에 해당하는 부모 메뉴를 기본으로 열어둠
  const getInitialOpenMenus = () => {
    const open: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        );
        if (isChildActive) {
          open[item.path] = true;
        }
      }
    });
    return open;
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialOpenMenus);

  // 경로 변경 시 해당 메뉴 자동 열기
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        );
        if (isChildActive) {
          setOpenMenus((prev) => ({ ...prev, [item.path]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (path: string) => {
    setOpenMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">EZStay 관리자</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isOpen = openMenus[item.path] ?? false;
          const hasChildren = !!item.children;

          // 부모 메뉴가 활성 상태인지: 자식 중 하나가 현재 경로일 때
          const isParentActive = hasChildren
            ? item.children!.some(
                (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
              )
            : false;

          return (
            <div key={item.path}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isParentActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
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
              )}

              {/* Sub-menu (토글) */}
              {hasChildren && isOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-gray-700 text-white'
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
          );
        })}
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
