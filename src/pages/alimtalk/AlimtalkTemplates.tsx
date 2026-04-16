import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { alimtalkService } from '../../services/alimtalkService';
import type { AlimtalkTemplate } from '../../types';
import { formatDateTime } from '../../utils/format';

const inspStatusMap: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
  APR: { label: '승인', variant: 'success' },
  REJ: { label: '거절', variant: 'danger' },
  REG: { label: '등록중', variant: 'warning' },
};

export const AlimtalkTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [activeTemplates, setActiveTemplates] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AlimtalkTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alimtalkService.getTemplates();
      setTemplates(data.templates);
      setTotalTemplates(data.totalTemplates);
      setActiveTemplates(data.activeTemplates);
      setLastSyncTime(data.lastSyncTime);
      setSyncError(data.syncError);
    } catch (err) {
      setError('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await alimtalkService.syncTemplates();
      setLastSyncTime(result.lastSyncTime);
      await loadTemplates();
      alert('템플릿 캐시가 갱신되었습니다.');
    } catch (err) {
      alert('템플릿 캐시 갱신에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.eventName && t.eventName.toLowerCase().includes(q)) ||
      (t.eventLabel && t.eventLabel.toLowerCase().includes(q)) ||
      (t.tplCode && t.tplCode.toLowerCase().includes(q)) ||
      (t.templtName && t.templtName.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <Button variant="secondary" className="mt-4" onClick={loadTemplates}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">전체 템플릿</p>
          <p className="text-2xl font-bold text-gray-900">{totalTemplates}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">활성 템플릿</p>
          <p className="text-2xl font-bold text-green-600">{activeTemplates}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">마지막 동기화</p>
          <p className="text-sm font-medium text-gray-900">
            {lastSyncTime ? formatDateTime(lastSyncTime) : '-'}
          </p>
          {syncError && (
            <p className="text-xs text-red-500 mt-1">{syncError}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="이벤트명, 템플릿명, 코드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '갱신 중...' : '캐시 갱신'}
          </Button>
        </div>
      </Card>

      {/* Template Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">이벤트명</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">템플릿명</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">템플릿 코드</th>
                {/* <th className="text-left py-3 px-4 font-medium text-gray-600">승인 상태</th> */}
                <th className="text-left py-3 px-4 font-medium text-gray-600">발송대상</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">연동</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">변수 매핑</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template, idx) => {
                return (
                  <tr
                    key={template.eventName || template.tplCode || idx}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <td className="py-3 px-4">
                      {template.eventName ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {template.eventName}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {template.eventLabel || template.templtName || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      {template.tplCode ? (
                        <span className="font-mono text-xs">{template.tplCode}</span>
                      ) : (
                        <span className="text-gray-400">미등록</span>
                      )}
                    </td>
                    {/* 승인 상태 컬럼 비노출
                    <td className="py-3 px-4">
                      {inspInfo ? (
                        <Badge variant={inspInfo.variant} size="sm">
                          {inspInfo.label}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    */}
                    <td className="py-3 px-4">
                      {template.targetRole ? (
                        <Badge
                          variant={template.targetRole === 'host' ? 'primary' : template.targetRole === 'guest' ? 'info' : 'warning'}
                          size="sm"
                        >
                          {template.targetRole === 'host' ? '호스트' : template.targetRole === 'guest' ? '게스트' : '공통'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={template.isLinked ? 'success' : 'default'}
                        size="sm"
                      >
                        {template.isLinked ? '연동' : '미연동'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {template.varMap && Object.keys(template.varMap).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(template.varMap).map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                              title={`${key} → #{${value}}`}
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다.' : '템플릿이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Template Detail Modal */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.eventLabel || selectedTemplate?.templtName || '템플릿 상세'}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">이벤트명</p>
                {selectedTemplate.eventName ? (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {selectedTemplate.eventName}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div>
                <p className="text-gray-500 mb-1">템플릿 코드</p>
                <p className="font-mono">{selectedTemplate.tplCode || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">발송대상</p>
                {selectedTemplate.targetRole ? (
                  <Badge
                    variant={selectedTemplate.targetRole === 'host' ? 'primary' : selectedTemplate.targetRole === 'guest' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {selectedTemplate.targetRole === 'host' ? '호스트' : selectedTemplate.targetRole === 'guest' ? '게스트' : '공통 (게스트+호스트)'}
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div>
                <p className="text-gray-500 mb-1">승인 상태</p>
                {selectedTemplate.inspStatus ? (
                  <Badge
                    variant={inspStatusMap[selectedTemplate.inspStatus]?.variant || 'default'}
                    size="sm"
                  >
                    {inspStatusMap[selectedTemplate.inspStatus]?.label || selectedTemplate.inspStatus}
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div>
                <p className="text-gray-500 mb-1">연동 상태</p>
                <div className="flex gap-2">
                  <Badge variant={selectedTemplate.isActive ? 'success' : 'default'} size="sm">
                    {selectedTemplate.isActive ? '활성' : '비활성'}
                  </Badge>
                  <Badge variant={selectedTemplate.isLinked ? 'success' : 'default'} size="sm">
                    {selectedTemplate.isLinked ? '연동' : '미연동'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Variable Mapping */}
            {selectedTemplate.varMap && Object.keys(selectedTemplate.varMap).length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">변수 매핑</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs">
                        <th className="text-left pb-2">JS 변수명</th>
                        <th className="text-left pb-2">카카오 템플릿 변수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedTemplate.varMap).map(([key, value]) => (
                        <tr key={key} className="border-t border-gray-200">
                          <td className="py-1.5 font-mono text-xs text-blue-700">{key}</td>
                          <td className="py-1.5 font-mono text-xs text-gray-700">{'#{' + value + '}'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Template Content */}
            {selectedTemplate.templtContent && (
              <div>
                <p className="text-sm text-gray-500 mb-2">템플릿 본문</p>
                <pre className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedTemplate.templtContent}
                </pre>
              </div>
            )}

            {/* Buttons */}
            {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">버튼 ({selectedTemplate.buttons.length}개)</p>
                <div className="space-y-2">
                  {selectedTemplate.buttons.map((btn, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
                    >
                      <div>
                        <span className="font-medium text-sm text-gray-900">{btn.name}</span>
                        {btn.linkType && (
                          <span className="ml-2 text-xs text-gray-500">({btn.linkType})</span>
                        )}
                      </div>
                      {btn.linkMo && (
                        <a
                          href={btn.linkMo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          링크
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Fetched */}
            {selectedTemplate.lastFetched && (
              <p className="text-xs text-gray-400 text-right">
                마지막 조회: {formatDateTime(selectedTemplate.lastFetched)}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AlimtalkTemplates;
