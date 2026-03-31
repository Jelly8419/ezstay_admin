import { useState, useEffect } from 'react';
import type {
  RentalItem,
  RentalItemStat,
  RentalItemType,
  SalesType,
  RentalItemCreateRequest,
  RentalItemUpdateRequest,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { rentalItemService } from '../../services/rentalItemService';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const ITEM_TYPE_OPTIONS: { value: RentalItemType | 'all'; label: string }[] = [
  { value: 'all',         label: '전체' },
  { value: 'hair_dryer',  label: '헤어드라이어' },
  { value: 'bedding_set', label: '침구 세트' },
  { value: 'amenity_kit', label: '어메니티 키트' },
  { value: 'towel_set',   label: '수건 세트' },
  { value: 'other',       label: '기타' },
];

const ACTIVE_OPTIONS: { value: 'all' | 'true' | 'false'; label: string }[] = [
  { value: 'all',   label: '전체' },
  { value: 'true',  label: '활성' },
  { value: 'false', label: '비활성' },
];

const SALES_TYPE_OPTIONS: { value: SalesType; label: string }[] = [
  { value: 'SALE',   label: '판매형' },
  { value: 'RENTAL', label: '대여형' },
];

const ITEM_TYPE_SELECT_OPTIONS: { value: RentalItemType; label: string }[] = [
  { value: 'hair_dryer',  label: '헤어드라이어' },
  { value: 'bedding_set', label: '침구 세트' },
  { value: 'amenity_kit', label: '어메니티 키트' },
  { value: 'towel_set',   label: '수건 세트' },
  { value: 'other',       label: '기타' },
];

// itemType → 기본 salesType
const DEFAULT_SALES_TYPE: Record<RentalItemType, SalesType> = {
  hair_dryer:  'RENTAL',
  bedding_set: 'RENTAL',
  amenity_kit: 'SALE',
  towel_set:   'SALE',
  other:       'SALE',
};

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function getStatusBadge(item: RentalItem) {
  if (!item.isActive) return <Badge variant="default">비활성</Badge>;
  if (item.isOutOfStock) return <Badge variant="danger">품절</Badge>;
  return <Badge variant="success">판매중</Badge>;
}

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ModalType = 'create' | 'edit' | 'stock' | 'delete' | null;

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function RentalItemList() {
  // 목록 & 통계
  const [items, setItems] = useState<RentalItem[]>([]);
  const [stats, setStats] = useState<RentalItemStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [itemTypeFilter, setItemTypeFilter] = useState<RentalItemType | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');

  // 모달
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  // 상품 등록 폼
  const [createForm, setCreateForm] = useState<RentalItemCreateRequest>({
    itemType: 'amenity_kit',
    salesType: 'SALE',
    name: '',
    price: 0,
    totalStock: 0,
    description: '',
    imageUrl: '',
    isActive: true,
  });

  // 상품 수정 폼
  const [editForm, setEditForm] = useState<RentalItemUpdateRequest>({});

  // 재고 조정 폼
  const [newAvailableStock, setNewAvailableStock] = useState(0);

  // ─── 데이터 로드 ────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { itemType?: RentalItemType; isActive?: boolean } = {};
      if (itemTypeFilter !== 'all') params.itemType = itemTypeFilter;
      if (activeFilter !== 'all') params.isActive = activeFilter === 'true';

      const [itemList, statList] = await Promise.all([
        rentalItemService.getList(params),
        rentalItemService.getStats(),
      ]);
      setItems(itemList);
      setStats(statList);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemTypeFilter, activeFilter]);

  // ─── 활성/비활성 토글 ───────────────────────────────────────────────────────

  const handleToggleActive = async (item: RentalItem) => {
    setToggleLoadingId(item.id);
    try {
      await rentalItemService.update(item.id, { isActive: !item.isActive });
      await loadData();
    } catch {
      alert('활성 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setToggleLoadingId(null);
    }
  };

  // ─── 모달 열기 ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm({
      itemType: 'amenity_kit',
      salesType: 'SALE',
      name: '',
      price: 0,
      totalStock: 0,
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setModalType('create');
  };

  const openEdit = (item: RentalItem) => {
    setSelectedItem(item);
    setEditForm({
      salesType: item.salesType,
      name: item.name,
      description: item.description ?? '',
      price: parseFloat(item.price),
      totalStock: item.totalStock,
      imageUrl: item.imageUrl ?? '',
      isActive: item.isActive,
    });
    setModalType('edit');
  };

  const openStock = (item: RentalItem) => {
    setSelectedItem(item);
    setNewAvailableStock(item.availableStock);
    setModalType('stock');
  };

  const openDelete = (item: RentalItem) => {
    setSelectedItem(item);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  // ─── 액션 ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.name.trim()) { alert('상품명을 입력하세요.'); return; }
    if (createForm.price < 0) { alert('가격은 0 이상이어야 합니다.'); return; }
    if (createForm.totalStock < 0) { alert('총 재고는 0 이상이어야 합니다.'); return; }

    setActionLoading(true);
    try {
      const body: RentalItemCreateRequest = {
        itemType: createForm.itemType,
        salesType: createForm.salesType,
        name: createForm.name.trim(),
        price: createForm.price,
        totalStock: createForm.totalStock,
        isActive: createForm.isActive,
      };
      if (createForm.description?.trim()) body.description = createForm.description.trim();
      if (createForm.imageUrl?.trim()) body.imageUrl = createForm.imageUrl.trim();

      await rentalItemService.create(body);
      closeModal();
      await loadData();
    } catch {
      alert('상품 등록 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    if (editForm.name !== undefined && !editForm.name.trim()) {
      alert('상품명을 입력하세요.');
      return;
    }
    if (editForm.price !== undefined && editForm.price < 0) {
      alert('가격은 0 이상이어야 합니다.');
      return;
    }
    if (editForm.totalStock !== undefined) {
      const rentedStock = selectedItem.rentedStock;
      if (editForm.totalStock < rentedStock) {
        alert(`현재 ${rentedStock}개 대여 중입니다. ${rentedStock}개 이상으로만 설정 가능합니다.`);
        return;
      }
    }

    setActionLoading(true);
    try {
      const body: RentalItemUpdateRequest = { ...editForm };
      if (body.name) body.name = body.name.trim();
      if (body.description !== undefined) body.description = body.description?.trim() || undefined;
      if (body.imageUrl !== undefined) body.imageUrl = body.imageUrl?.trim() || undefined;

      await rentalItemService.update(selectedItem.id, body);
      closeModal();
      await loadData();
    } catch {
      alert('상품 수정 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    if (newAvailableStock < 0 || newAvailableStock > selectedItem.totalStock) {
      alert(`가능 수량은 0 이상 총재고(${selectedItem.totalStock})개 이하여야 합니다.`);
      return;
    }

    setActionLoading(true);
    try {
      await rentalItemService.adjustStock(selectedItem.id, newAvailableStock);
      closeModal();
      await loadData();
    } catch {
      alert('재고 조정 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      await rentalItemService.delete(selectedItem.id);
      closeModal();
      await loadData();
    } catch (err: any) {
      const code = err?.code;
      if (code === 4007) {
        alert('현재 대여 중인 수량이 있어 삭제할 수 없습니다.\n비활성화 처리를 사용하세요.');
      } else {
        alert('상품 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ─── 렌더 ───────────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name',
      title: '상품명',
      render: (_: any, item: RentalItem) => (
        <div className="flex items-center gap-2">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0" />
          )}
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            {item.description && (
              <div className="text-xs text-gray-400 truncate max-w-[160px]">{item.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'itemTypeLabel',
      title: '카테고리',
      render: (_: any, item: RentalItem) => (
        <span className="text-sm text-gray-700">{item.itemTypeLabel}</span>
      ),
    },
    {
      key: 'salesType',
      title: '판매유형',
      render: (_: any, item: RentalItem) => (
        <Badge variant={item.salesType === 'RENTAL' ? 'info' : 'default'}>
          {item.salesTypeLabel}
        </Badge>
      ),
    },
    {
      key: 'price',
      title: '가격',
      render: (_: any, item: RentalItem) => (
        <span className="text-sm tabular-nums">{formatCurrency(parseFloat(item.price))}</span>
      ),
    },
    {
      key: 'totalStock',
      title: '총재고',
      render: (_: any, item: RentalItem) => (
        <span className="text-sm tabular-nums">{item.totalStock}</span>
      ),
    },
    {
      key: 'rentedStock',
      title: '사용중',
      render: (_: any, item: RentalItem) => (
        <span className={`text-sm tabular-nums ${item.rentedStock > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
          {item.rentedStock}
        </span>
      ),
    },
    {
      key: 'availableStock',
      title: '가능수량',
      render: (_: any, item: RentalItem) => (
        <span className={`text-sm tabular-nums font-medium ${item.availableStock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {item.availableStock}
        </span>
      ),
    },
    {
      key: 'isOutOfStock',
      title: '상태',
      render: (_: any, item: RentalItem) => getStatusBadge(item),
    },
    {
      key: 'isActive',
      title: '활성여부',
      render: (_: any, item: RentalItem) => (
        <button
          onClick={() => handleToggleActive(item)}
          disabled={toggleLoadingId === item.id}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
            ${item.isActive ? 'bg-primary-500' : 'bg-gray-300'}
            ${toggleLoadingId === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
              ${item.isActive ? 'translate-x-4' : 'translate-x-1'}`}
          />
        </button>
      ),
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, item: RentalItem) => (
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => openStock(item)}>
            재고조정
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => openDelete(item)}
            disabled={item.rentedStock > 0}
            title={item.rentedStock > 0 ? '대여 중인 수량이 있어 삭제 불가' : undefined}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">재고 관리</h1>
        <Button variant="primary" onClick={openCreate}>
          + 상품 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.itemType} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{stat.itemTypeLabel}</span>
                <Badge variant={stat.salesType === 'RENTAL' ? 'info' : 'default'} >
                  {stat.salesTypeLabel}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품 수</span>
                  <span className="font-medium">{stat.itemCount}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">총재고</span>
                  <span className="font-medium">{stat.totalStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">사용중</span>
                  <span className={stat.rentedStock > 0 ? 'text-orange-600 font-medium' : 'text-gray-700'}>
                    {stat.rentedStock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">가능</span>
                  <span className={stat.availableStock === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {stat.availableStock}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">카테고리</label>
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value as RentalItemType | 'all')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ITEM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">활성 상태</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ACTIVE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 ml-auto text-sm text-gray-500">
            총 <span className="font-semibold text-gray-800 mx-1">{items.length}</span>개
          </div>
        </div>
      </Card>

      {/* 목록 테이블 */}
      <Card>
        {error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">등록된 상품이 없습니다.</div>
        ) : (
          <Table columns={columns} data={items} />
        )}
      </Card>

      {/* ── 상품 등록 모달 ── */}
      <Modal
        isOpen={modalType === 'create'}
        onClose={closeModal}
        title="상품 등록"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select
                value={createForm.itemType}
                onChange={(e) => {
                  const t = e.target.value as RentalItemType;
                  setCreateForm((f) => ({ ...f, itemType: t, salesType: DEFAULT_SALES_TYPE[t] }));
                }}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ITEM_TYPE_SELECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">판매유형 *</label>
              <select
                value={createForm.salesType}
                onChange={(e) => setCreateForm((f) => ({ ...f, salesType: e.target.value as SalesType }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SALES_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
            <input
              type="text"
              maxLength={100}
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="상품명을 입력하세요"
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원) *</label>
              <input
                type="number"
                min={0}
                value={createForm.price}
                onChange={(e) => setCreateForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">총 재고 *</label>
              <input
                type="number"
                min={0}
                value={createForm.totalStock}
                onChange={(e) => setCreateForm((f) => ({ ...f, totalStock: Number(e.target.value) }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
            <textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="상품 설명을 입력하세요 (선택)"
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
            <input
              type="text"
              value={createForm.imageUrl}
              onChange={(e) => setCreateForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="이미지 URL (선택)"
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="create-isActive"
              type="checkbox"
              checked={createForm.isActive}
              onChange={(e) => setCreateForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="create-isActive" className="text-sm text-gray-700">등록 즉시 활성화</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>취소</Button>
            <Button variant="primary" onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? '등록 중...' : '등록'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 상품 수정 모달 ── */}
      <Modal
        isOpen={modalType === 'edit'}
        onClose={closeModal}
        title="상품 수정"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">
              카테고리: <span className="font-medium text-gray-700">{selectedItem.itemTypeLabel}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">판매유형</label>
              <select
                value={editForm.salesType}
                onChange={(e) => setEditForm((f) => ({ ...f, salesType: e.target.value as SalesType }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SALES_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <input
                type="text"
                maxLength={100}
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.price ?? 0}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 재고
                  <span className="ml-1 text-xs text-orange-500 font-normal">
                    (현재 대여중: {selectedItem.rentedStock}개)
                  </span>
                </label>
                <input
                  type="number"
                  min={selectedItem.rentedStock}
                  value={editForm.totalStock ?? 0}
                  onChange={(e) => setEditForm((f) => ({ ...f, totalStock: Number(e.target.value) }))}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
              <textarea
                rows={2}
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input
                type="text"
                value={editForm.imageUrl ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-isActive"
                type="checkbox"
                checked={editForm.isActive ?? true}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="edit-isActive" className="text-sm text-gray-700">활성화</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>취소</Button>
              <Button variant="primary" onClick={handleEdit} disabled={actionLoading}>
                {actionLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── 재고 조정 모달 ── */}
      <Modal
        isOpen={modalType === 'stock'}
        onClose={closeModal}
        title="재고 수량 조정"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="font-medium text-gray-800">{selectedItem.name}</div>
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div className="bg-white rounded border px-2 py-2">
                  <div className="text-xs text-gray-400 mb-0.5">총재고</div>
                  <div className="font-semibold">{selectedItem.totalStock}</div>
                </div>
                <div className="bg-white rounded border px-2 py-2">
                  <div className="text-xs text-gray-400 mb-0.5">사용중</div>
                  <div className="font-semibold text-orange-600">{selectedItem.rentedStock}</div>
                </div>
                <div className="bg-white rounded border px-2 py-2">
                  <div className="text-xs text-gray-400 mb-0.5">현재 가능</div>
                  <div className={`font-semibold ${selectedItem.availableStock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedItem.availableStock}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-700">
              분실, 파손 등 예외 상황에서 실제 가용 재고를 강제로 맞출 때 사용합니다.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 가용 재고 수량
                <span className="ml-1 text-xs text-gray-400 font-normal">(0 ~ {selectedItem.totalStock})</span>
              </label>
              <input
                type="number"
                min={0}
                max={selectedItem.totalStock}
                value={newAvailableStock}
                onChange={(e) => setNewAvailableStock(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>취소</Button>
              <Button variant="primary" onClick={handleAdjustStock} disabled={actionLoading}>
                {actionLoading ? '저장 중...' : '조정 저장'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── 삭제 확인 모달 ── */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        title="상품 삭제"
      >
        {selectedItem && (
          <div className="space-y-4">
            {selectedItem.rentedStock > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700 space-y-1">
                <div className="font-semibold">삭제할 수 없습니다</div>
                <div>현재 <strong>{selectedItem.rentedStock}개</strong>가 대여/판매 중입니다.</div>
                <div className="text-xs mt-1">게스트 노출만 차단하려면 비활성화를 사용하세요.</div>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{selectedItem.name}</span> 상품을 삭제하시겠습니까?
                </div>
                <div className="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다.</div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
                {selectedItem.rentedStock > 0 ? '닫기' : '취소'}
              </Button>
              {selectedItem.rentedStock === 0 && (
                <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? '삭제 중...' : '삭제'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
