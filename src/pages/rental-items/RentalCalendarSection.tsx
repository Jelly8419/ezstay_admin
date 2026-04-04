import { useState, useEffect } from 'react';
import type { RentalCalendarBulkData, RentalCalendarItem, RentalItemType } from '../../types';
import { rentalItemService } from '../../services/rentalItemService';
import { Card } from '../../components/ui/Card';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const ITEM_TYPE_COLOR: Partial<Record<RentalItemType, string>> = {
  hair_dryer:  '#378ADD',
  bedding_set: '#1D9E75',
  towel_set:   '#D85A30',
  amenity_kit: '#BA7517',
};

const WARN_RATIO = 0.5;
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function getAvail(item: RentalCalendarItem, dateKey: string): number {
  const entry = item.calendar[dateKey];
  return Math.max(0, entry?.availableQuantity ?? item.totalStock);
}

function getWorstStatus(dateKey: string, items: RentalCalendarItem[]): 'available' | 'warning' | 'soldout' {
  let worst: 'available' | 'warning' | 'soldout' = 'available';
  for (const item of items) {
    const avail = getAvail(item, dateKey);
    if (avail === 0) return 'soldout';
    if (avail < item.totalStock * WARN_RATIO) worst = 'warning';
  }
  return worst;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toDayLabel(year: number, month: number, day: number): string {
  return DAY_LABELS[new Date(year, month - 1, day).getDay()];
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function CalendarCell({
  day, dateKey, items, isSelected, isToday, onClick,
}: {
  day: number;
  dateKey: string;
  items: RentalCalendarItem[];
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const status = getWorstStatus(dateKey, items);
  const warn = status !== 'available';

  const cellBg = isSelected
    ? 'bg-[#E6F1FB] border-[#378ADD]'
    : status === 'soldout'
      ? 'bg-red-50 border-red-200'
      : status === 'warning'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-[#f5f5f5] border-transparent';

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-12 rounded-md border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${cellBg}`}
    >
      <span className={`text-[12px] leading-none ${
        isSelected ? 'text-[#0C447C] font-medium' :
        isToday    ? 'text-[#185FA5] font-medium' :
                     'text-[#222]'
      }`}>
        {day}
      </span>
      {warn && (
        <div className="absolute top-[4px] right-[4px] w-1.5 h-1.5 rounded-full bg-[#E24B4A]" />
      )}
    </div>
  );
}

function ItemBar({ item, dateKey }: { item: RentalCalendarItem; dateKey: string }) {
  const rented = Math.max(0, item.totalStock - getAvail(item, dateKey));
  const pct = item.totalStock > 0 ? Math.round((rented / item.totalStock) * 100) : 0;
  const isWarn = rented / item.totalStock >= WARN_RATIO;
  const barColor = isWarn ? '#E24B4A' : (ITEM_TYPE_COLOR[item.itemType] ?? '#378ADD');

  return (
    <div className="py-2.5 border-b border-[#eee] last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1 text-[12px] text-[#666]">
          {item.name}
          <span
            className="text-[10px] px-[5px] py-px rounded-[3px] font-medium ml-1"
            style={isWarn
              ? { background: '#FCEBEB', color: '#A32D2D' }
              : { background: '#EAF3DE', color: '#3B6D11' }
            }
          >
            {isWarn ? '부족 주의' : '여유'}
          </span>
        </span>
        <span className="text-[12px] font-medium text-[#111]">{rented}/{item.totalStock}</span>
      </div>
      <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function RentalCalendarSection() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [data, setData] = useState<RentalCalendarBulkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rentalItemService.getCalendarBulk(y, m);
      setData(result);
    } catch {
      setError('캘린더 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(year, month); }, []);

  const changeMonth = (dir: 1 | -1) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setYear(y); setMonth(m); setSelectedDay(1);
    fetchData(y, m);
  };

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const selectedDateKey = toDateKey(year, month, selectedDay);
  const selectedDow = toDayLabel(year, month, selectedDay);
  const items = data?.items ?? [];
  const totalRented = items.reduce((sum, item) =>
    sum + Math.max(0, item.totalStock - getAvail(item, selectedDateKey)), 0);

  return (
    <Card className="p-5">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">렌탈 재고 캘린더 현황</h2>

        <div className="flex items-center gap-4">
          {/* 범례 */}
          <div className="flex items-center gap-3 text-[11px] text-[#888]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#f5f5f5] border border-[#ddd]" />
              여유
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-50 border border-yellow-200" />
              주의
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" />
              품절
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E24B4A]" />
              1개 이상 주의
            </span>
          </div>

          {/* 새로고침 */}
          <button
            onClick={() => fetchData(year, month)}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
      ) : (
        <div className="flex gap-5 items-stretch">

          {/* ── 좌: 캘린더 ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 월 이동 — 년월 텍스트 양옆에 버튼 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={() => changeMonth(-1)}
                disabled={loading}
                className="w-7 h-7 flex items-center justify-center border border-[#ccc] rounded-lg text-[#666] text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >←</button>
              <span className="text-[15px] font-medium text-[#111] w-24 text-center">{year}년 {month}월</span>
              <button
                onClick={() => changeMonth(1)}
                disabled={loading}
                className="w-7 h-7 flex items-center justify-center border border-[#ccc] rounded-lg text-[#666] text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >→</button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* 요일 헤더 */}
                {DAY_LABELS.map((d) => (
                  <div key={d} className="flex items-center justify-center h-7 text-[11px] text-[#aaa]">{d}</div>
                ))}
                {/* 빈 셀 */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`e-${i}`} className="w-full h-12" />
                ))}
                {/* 날짜 셀 */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = toDateKey(year, month, day);
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() + 1 === month &&
                    today.getDate() === day;
                  return (
                    <CalendarCell
                      key={day}
                      day={day}
                      dateKey={dateKey}
                      items={items}
                      isSelected={day === selectedDay}
                      isToday={isToday}
                      onClick={() => setSelectedDay(day)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 우: 사이드 패널 ── */}
          <div className="w-56 flex-shrink-0 flex flex-col">
            {/* 월 이동 헤더(28+12=40px) + 요일 헤더 행(28+4=32px) = 72px 스페이서 */}
            <div className="h-[72px]" />
            <div className="border border-[#e5e5e5] rounded-xl p-3.5 flex flex-col flex-1">
              {/* 선택 날짜 */}
              <div className="text-[13px] font-medium text-[#111] pb-2.5 mb-0.5 border-b border-[#eee]">
                {month}월 {selectedDay}일 ({selectedDow}) 현황
              </div>

              {/* 품목별 바 — 모두 표시 */}
              <div className="flex-1">
                {loading ? (
                  <div className="text-center py-5 text-[12px] text-[#bbb]">불러오는 중...</div>
                ) : items.length === 0 ? (
                  <div className="text-center py-5 text-[12px] text-[#bbb]">렌탈 상품 없음</div>
                ) : (
                  items.map((item) => (
                    <ItemBar key={item.rentalItemId} item={item} dateKey={selectedDateKey} />
                  ))
                )}
              </div>

              {/* 총 대여 */}
              {!loading && items.length > 0 && (
                <div className="flex justify-between items-baseline mt-auto pt-2.5 border-t border-[#eee]">
                  <span className="text-[12px] text-[#aaa]">총 대여</span>
                  <span className="text-[17px] font-medium text-[#111]">{totalRented}개</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </Card>
  );
}
