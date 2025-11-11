import React, { useState } from 'react';
import { Bell, HelpCircle, Mail } from 'lucide-react';
import { NoticeManager } from './NoticeManager';
import { FAQManager } from './FAQManager';
import { InquiryManager } from './InquiryManager';

type TabType = 'notices' | 'faq' | 'inquiries';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const SupportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notices');

  const tabs: Tab[] = [
    {
      id: 'notices',
      label: '공지사항',
      icon: <Bell className="w-5 h-5" />,
      component: <NoticeManager />,
    },
    {
      id: 'faq',
      label: 'FAQ 관리',
      icon: <HelpCircle className="w-5 h-5" />,
      component: <FAQManager />,
    },
    {
      id: 'inquiries',
      label: '문의 관리',
      icon: <Mail className="w-5 h-5" />,
      component: <InquiryManager />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">고객센터 관리</h1>
        <p className="text-gray-500 mt-1">공지사항, FAQ, 문의를 관리합니다</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};
