import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import AlimtalkTemplates from './AlimtalkTemplates';
import AlimtalkLogs from './AlimtalkLogs';
import AlimtalkStats from './AlimtalkStats';

type TabType = 'templates' | 'logs' | 'stats';

const tabs: { key: TabType; label: string }[] = [
  { key: 'templates', label: '템플릿 관리' },
  { key: 'logs', label: '발송 이력' },
  { key: 'stats', label: '발송 통계' },
];

export const AlimtalkManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-yellow-100 p-2 rounded-lg">
          <MessageSquare className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림톡 관리</h1>
          <p className="text-sm text-gray-500">카카오 알림톡 템플릿 및 발송 이력을 관리합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && <AlimtalkTemplates />}
      {activeTab === 'logs' && <AlimtalkLogs />}
      {activeTab === 'stats' && <AlimtalkStats />}
    </div>
  );
};

export default AlimtalkManagement;
