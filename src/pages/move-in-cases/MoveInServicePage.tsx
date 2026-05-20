import MoveInCaseList from './MoveInCaseList';

export default function MoveInServicePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">입주 준비 서비스</h1>
      <MoveInCaseList />
    </div>
  );
}
