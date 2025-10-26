import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { userService, User } from '../../services/userService';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'local' | 'social'>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery, userTypeFilter, isActiveFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
        isActive: isActiveFilter !== 'all' ? isActiveFilter === 'true' : undefined,
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('유저 목록 로드 실패:', err);
      setError('유저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 검색 시 첫 페이지로
  };

  const columns = [
    {
      key: 'id',
      title: '회원번호',
      width: '80px'
    },
    {
      key: 'name',
      title: '이름',
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'email',
      title: '이메일'
    },
    {
      key: 'phoneNumber',
      title: '연락처',
      render: (value: string, record: User) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {record.phoneVerified ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      )
    },
    {
      key: 'userType',
      title: '회원 타입',
      render: (value: string) => value === 'local' ? '일반' : '소셜'
    },
    {
      key: 'isActive',
      title: '상태',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? '정상' : '비활성'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: '가입일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    },
    {
      key: 'lastLoginAt',
      title: '마지막 로그인',
      render: (value: string | null | undefined) =>
        value ? new Date(value).toLocaleDateString('ko-KR') : '-'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">유저 관리</h1>
        <p className="text-gray-500 mt-2">플랫폼 사용자 정보를 조회하고 관리합니다</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="이름, 이메일, 전화번호로 검색"
            value={searchQuery}
            onChange={handleSearch}
          />
          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value as 'all' | 'local' | 'social');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 회원 타입</option>
            <option value="local">일반 회원</option>
            <option value="social">소셜 회원</option>
          </select>
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as 'all' | 'true' | 'false');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 상태</option>
            <option value="true">정상</option>
            <option value="false">비활성</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-900 font-semibold mb-1">데이터 로드 실패</p>
              <p className="text-gray-500 mb-3">{error}</p>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>명
              </div>
            </div>
            <Table
              columns={columns}
              data={users}
              onRowClick={(user) => navigate(`/users/${user.id}`)}
            />
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
