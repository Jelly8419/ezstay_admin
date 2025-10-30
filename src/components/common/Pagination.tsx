import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const delta = 2; // 현재 페이지 기준 좌우로 표시할 페이지 수
    const pages: (number | string)[] = [];

    // 시작과 끝 페이지 계산
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // 첫 페이지
    pages.push(1);

    // 첫 페이지와 범위 사이에 간격이 있으면 ... 추가
    if (rangeStart > 2) {
      pages.push('...');
    }

    // 중간 페이지들
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // 범위와 마지막 페이지 사이에 간격이 있으면 ... 추가
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // 마지막 페이지 (totalPages가 1보다 큰 경우에만)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`px-4 py-2 rounded-lg ${
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
