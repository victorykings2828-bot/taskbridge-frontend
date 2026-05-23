const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-surface rounded-xl p-6 shadow-card border border-navy-200">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-32" />
  </div>
);

export const TaskRowSkeleton = () => (
  <div className="bg-surface rounded-xl p-4 shadow-card border border-navy-200 flex items-center gap-4">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <TaskRowSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
