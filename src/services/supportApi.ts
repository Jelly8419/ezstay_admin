/**
 * 고객센터 관련 API 서비스
 */

import { api } from './api';
import type {
  Notice,
  NoticeFormData,
  FAQ,
  FAQCategory,
  FAQFormData,
  InquiryDetail,
  PaginatedResponse,
} from '../types';

// ========================================
// 공지사항 API
// ========================================

export const noticeApi = {
  /**
   * 공지사항 목록 조회 (관리자)
   */
  getNotices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userType?: string;
    search?: string;
  }): Promise<PaginatedResponse<Notice>> => {
    const response = await api.get<{ notices: Notice[]; pagination: any }>('/admin/support/notices', { params });
    return {
      items: response.notices,
      pagination: {
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalPages: response.pagination.totalPages,
      },
    };
  },

  /**
   * 공지사항 상세 조회
   */
  getNoticeById: async (noticeId: number): Promise<Notice> => {
    return api.get<Notice>(`/admin/support/notices/${noticeId}`);
  },

  /**
   * 공지사항 생성
   */
  createNotice: async (noticeData: NoticeFormData): Promise<Notice> => {
    return api.post<Notice>('/admin/support/notices', noticeData);
  },

  /**
   * 공지사항 수정
   */
  updateNotice: async (
    noticeId: number,
    noticeData: Partial<NoticeFormData>
  ): Promise<Notice> => {
    return api.patch<Notice>(`/admin/support/notices/${noticeId}`, noticeData);
  },

  /**
   * 공지사항 게시
   */
  publishNotice: async (noticeId: number): Promise<Notice> => {
    return api.patch<Notice>(`/admin/support/notices/${noticeId}/publish`);
  },

  /**
   * 공지사항 삭제
   */
  deleteNotice: async (noticeId: number): Promise<void> => {
    return api.delete<void>(`/admin/support/notices/${noticeId}`);
  },
};

// ========================================
// FAQ API
// ========================================

export const faqApi = {
  /**
   * FAQ 카테고리 목록 조회
   */
  getCategories: async (params?: { userType?: string; isActive?: boolean }): Promise<FAQCategory[]> => {
    const response = await api.get<{ categories?: FAQCategory[] } | FAQCategory[]>('/admin/support/faq/categories', { params });
    // 배열 또는 { categories: [...] } 형태 모두 지원
    return Array.isArray(response) ? response : (response.categories || []);
  },

  /**
   * FAQ 카테고리 생성
   */
  createCategory: async (categoryData: {
    name: string;
    userType: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<FAQCategory> => {
    return api.post<FAQCategory>('/admin/support/faq/categories', categoryData);
  },

  /**
   * FAQ 카테고리 수정
   */
  updateCategory: async (
    categoryId: number,
    categoryData: Partial<FAQCategory>
  ): Promise<FAQCategory> => {
    return api.patch<FAQCategory>(
      `/admin/support/faq/categories/${categoryId}`,
      categoryData
    );
  },

  /**
   * FAQ 카테고리 삭제
   */
  deleteCategory: async (categoryId: number): Promise<void> => {
    return api.delete<void>(`/admin/support/faq/categories/${categoryId}`);
  },

  /**
   * FAQ 목록 조회
   */
  getFAQs: async (params?: {
    categoryId?: number;
    userType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<FAQ[]> => {
    const response = await api.get<{ faqs?: FAQ[] } | FAQ[]>('/admin/support/faqs', { params });
    // 배열 또는 { faqs: [...] } 형태 모두 지원
    return Array.isArray(response) ? response : (response.faqs || []);
  },

  /**
   * FAQ 상세 조회
   */
  getFAQById: async (faqId: number): Promise<FAQ> => {
    return api.get<FAQ>(`/admin/support/faqs/${faqId}`);
  },

  /**
   * FAQ 생성
   */
  createFAQ: async (faqData: FAQFormData): Promise<FAQ> => {
    return api.post<FAQ>('/admin/support/faqs', faqData);
  },

  /**
   * FAQ 수정
   */
  updateFAQ: async (faqId: number, faqData: Partial<FAQFormData>): Promise<FAQ> => {
    return api.patch<FAQ>(`/admin/support/faqs/${faqId}`, faqData);
  },

  /**
   * FAQ 삭제
   */
  deleteFAQ: async (faqId: number): Promise<void> => {
    return api.delete<void>(`/admin/support/faqs/${faqId}`);
  },
};

// ========================================
// 문의 API
// ========================================

export const inquiryApi = {
  /**
   * 문의 목록 조회 (관리자)
   */
  getInquiries: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryType?: string;
    userType?: string;
    search?: string;
    userId?: number;
  }): Promise<PaginatedResponse<InquiryDetail>> => {
    const response = await api.get<{ inquiries: InquiryDetail[]; pagination: any }>('/admin/support/inquiries', {
      params,
    });
    return {
      items: response.inquiries,
      pagination: {
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalPages: response.pagination.totalPages,
      },
    };
  },

  /**
   * 문의 상세 조회
   */
  getInquiryById: async (inquiryId: number): Promise<InquiryDetail> => {
    return api.get<InquiryDetail>(`/admin/support/inquiries/${inquiryId}`);
  },

  /**
   * 문의 답변 등록
   */
  answerInquiry: async (inquiryId: number, answer: string): Promise<InquiryDetail> => {
    return api.post<InquiryDetail>(`/admin/support/inquiries/${inquiryId}/answer`, {
      answer,
    });
  },

  /**
   * 문의 상태 변경
   */
  updateInquiryStatus: async (
    inquiryId: number,
    status: string
  ): Promise<InquiryDetail> => {
    return api.patch<InquiryDetail>(`/admin/support/inquiries/${inquiryId}/status`, {
      status,
    });
  },

  /**
   * 문의 삭제
   */
  deleteInquiry: async (inquiryId: number): Promise<void> => {
    return api.delete<void>(`/admin/support/inquiries/${inquiryId}`);
  },
};
