import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RichTextEditor } from '../../components/support/RichTextEditor';
import { Plus, Edit, Trash2, AlertCircle, Folder, FileText } from 'lucide-react';
import { faqApi } from '../../services/supportApi';
import type { FAQ, FAQCategory, FAQFormData } from '../../types';

export const FAQManager: React.FC = () => {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 선택된 카테고리
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // 카테고리 모달
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    userType: 'all' as 'all' | 'host' | 'guest',
    displayOrder: 0,
    isActive: true,
  });
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);

  // FAQ 모달
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [faqFormData, setFAQFormData] = useState<FAQFormData>({
    categoryId: 0,
    question: '',
    answer: '',
    displayOrder: 0,
    isActive: true,
  });
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  // 삭제 모달
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'faq';
    data: FAQCategory | FAQ | null;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      loadFAQs();
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await faqApi.getCategories();
      setCategories(data || []);
      if (data && data.length > 0 && selectedCategoryId === null) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (err: any) {
      console.error('카테고리 조회 실패:', err);
      setError(err.message || '카테고리를 불러오는데 실패했습니다.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    if (selectedCategoryId === null) return;

    try {
      const data = await faqApi.getFAQs({ categoryId: selectedCategoryId });
      setFAQs(data || []);
    } catch (err: any) {
      console.error('FAQ 조회 실패:', err);
      setFAQs([]);
    }
  };

  // 카테고리 모달 열기
  const handleOpenCategoryModal = (category?: FAQCategory) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryFormData({
        name: category.name,
        userType: category.userType,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({
        name: '',
        userType: 'all',
        displayOrder: 0,
        isActive: true,
      });
    }
    setIsCategoryModalOpen(true);
  };

  // 카테고리 저장
  const handleSubmitCategory = async () => {
    if (!categoryFormData.name) {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedCategory) {
        await faqApi.updateCategory(selectedCategory.id, categoryFormData);
        alert('카테고리가 수정되었습니다.');
      } else {
        await faqApi.createCategory(categoryFormData);
        alert('카테고리가 생성되었습니다.');
      }
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (err: any) {
      console.error('카테고리 저장 실패:', err);
      alert(err.message || '카테고리 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FAQ 모달 열기
  const handleOpenFAQModal = (faq?: FAQ) => {
    if (faq) {
      setSelectedFAQ(faq);
      setFAQFormData({
        categoryId: faq.categoryId,
        question: faq.question,
        answer: faq.answer,
        displayOrder: faq.displayOrder,
        isActive: faq.isActive,
      });
    } else {
      setSelectedFAQ(null);
      setFAQFormData({
        categoryId: selectedCategoryId || 0,
        question: '',
        answer: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setIsFAQModalOpen(true);
  };

  // FAQ 저장
  const handleSubmitFAQ = async () => {
    if (!faqFormData.question || !faqFormData.answer) {
      alert('질문과 답변을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedFAQ) {
        await faqApi.updateFAQ(selectedFAQ.id, faqFormData);
        alert('FAQ가 수정되었습니다.');
      } else {
        await faqApi.createFAQ(faqFormData);
        alert('FAQ가 생성되었습니다.');
      }
      setIsFAQModalOpen(false);
      loadFAQs();
    } catch (err: any) {
      console.error('FAQ 저장 실패:', err);
      alert(err.message || 'FAQ 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제 모달 열기
  const handleOpenDeleteModal = (type: 'category' | 'faq', data: FAQCategory | FAQ) => {
    setDeleteTarget({ type, data });
    setIsDeleteModalOpen(true);
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.data) return;

    try {
      setIsSubmitting(true);
      if (deleteTarget.type === 'category' && 'name' in deleteTarget.data) {
        await faqApi.deleteCategory(deleteTarget.data.id);
        alert('카테고리가 삭제되었습니다.');
        loadCategories();
        setSelectedCategoryId(null);
      } else if (deleteTarget.type === 'faq' && 'question' in deleteTarget.data) {
        await faqApi.deleteFAQ(deleteTarget.data.id);
        alert('FAQ가 삭제되었습니다.');
        loadFAQs();
      }
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error('삭제 실패:', err);
      alert(err.message || '삭제에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">FAQ를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">FAQ 로드 실패</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadCategories}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 카테고리 목록 (좌측) */}
      <div className="col-span-12 md:col-span-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">FAQ 카테고리</h3>
            <Button size="sm" onClick={() => handleOpenCategoryModal()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                  selectedCategoryId === category.id
                    ? 'bg-primary-50 border-2 border-primary-600'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="default" size="sm">
                    {category.userType === 'all'
                      ? '전체'
                      : category.userType === 'host'
                      ? '호스트'
                      : '게스트'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCategoryModal(category);
                    }}
                    className="p-1 hover:bg-white rounded"
                  >
                    <Edit className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteModal('category', category);
                    }}
                    className="p-1 hover:bg-white rounded"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* FAQ 목록 (우측) */}
      <div className="col-span-12 md:col-span-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">FAQ 목록</h3>
            <Button
              onClick={() => handleOpenFAQModal()}
              disabled={selectedCategoryId === null}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 FAQ
            </Button>
          </div>

          {selectedCategoryId === null ? (
            <div className="text-center py-12 text-gray-500">
              카테고리를 선택해주세요.
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              FAQ가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{faq.question}</h4>
                        {!faq.isActive && (
                          <Badge variant="default" size="sm">
                            비활성
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleOpenFAQModal(faq)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal('faq', faq)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 카테고리 모달 */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedCategory ? '카테고리 수정' : '카테고리 생성'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleSubmitCategory} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리명 *
            </label>
            <input
              type="text"
              value={categoryFormData.name}
              onChange={(e) =>
                setCategoryFormData({ ...categoryFormData, name: e.target.value })
              }
              placeholder="전체, 방 등록, 예약/결제 등"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대상 사용자
            </label>
            <select
              value={categoryFormData.userType}
              onChange={(e) =>
                setCategoryFormData({
                  ...categoryFormData,
                  userType: e.target.value as 'all' | 'host' | 'guest',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">전체</option>
              <option value="host">호스트</option>
              <option value="guest">게스트</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              표시 순서
            </label>
            <input
              type="number"
              value={categoryFormData.displayOrder}
              onChange={(e) =>
                setCategoryFormData({
                  ...categoryFormData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="categoryIsActive"
              checked={categoryFormData.isActive}
              onChange={(e) =>
                setCategoryFormData({
                  ...categoryFormData,
                  isActive: e.target.checked,
                })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="categoryIsActive" className="text-sm font-medium text-gray-700">
              활성화
            </label>
          </div>
        </div>
      </Modal>

      {/* FAQ 모달 */}
      <Modal
        isOpen={isFAQModalOpen}
        onClose={() => setIsFAQModalOpen(false)}
        title={selectedFAQ ? 'FAQ 수정' : 'FAQ 생성'}
        size="xl"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsFAQModalOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleSubmitFAQ} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              질문 *
            </label>
            <input
              type="text"
              value={faqFormData.question}
              onChange={(e) => setFAQFormData({ ...faqFormData, question: e.target.value })}
              placeholder="자주 묻는 질문을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              답변 *
            </label>
            <RichTextEditor
              value={faqFormData.answer}
              onChange={(value) => setFAQFormData({ ...faqFormData, answer: value })}
              rows={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              표시 순서
            </label>
            <input
              type="number"
              value={faqFormData.displayOrder}
              onChange={(e) =>
                setFAQFormData({
                  ...faqFormData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="faqIsActive"
              checked={faqFormData.isActive}
              onChange={(e) =>
                setFAQFormData({
                  ...faqFormData,
                  isActive: e.target.checked,
                })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="faqIsActive" className="text-sm font-medium text-gray-700">
              활성화
            </label>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={deleteTarget?.type === 'category' ? '카테고리 삭제' : 'FAQ 삭제'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-900">
            {deleteTarget?.type === 'category' && deleteTarget.data && 'name' in deleteTarget.data && (
              <>
                <strong>{deleteTarget.data.name}</strong> 카테고리를 삭제하시겠습니까?
              </>
            )}
            {deleteTarget?.type === 'faq' && deleteTarget.data && 'question' in deleteTarget.data && (
              <>
                <strong>{deleteTarget.data.question}</strong> FAQ를 삭제하시겠습니까?
              </>
            )}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ 삭제된 항목은 복구할 수 없습니다.
              {deleteTarget?.type === 'category' && (
                <span className="block mt-1">
                  카테고리 내에 FAQ가 있는 경우 삭제할 수 없습니다.
                </span>
              )}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
