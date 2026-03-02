export function LoadingSkeleton({
  type = "card",
}: {
  type?: "card" | "table" | "list";
}) {
  if (type === "table") {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 bg-gray-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-16 w-16 bg-gray-700 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-dark-light rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-700 rounded"></div>
            </div>
            <div className="h-8 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-dark-light rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-700 rounded w-24"></div>
        <div className="h-8 w-8 bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-700 rounded w-32 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-20"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-700">
        <div className="h-4 bg-gray-600 rounded w-1/4"></div>
        <div className="h-4 bg-gray-600 rounded w-1/4"></div>
        <div className="h-4 bg-gray-600 rounded w-1/4"></div>
        <div className="h-4 bg-gray-600 rounded w-1/4"></div>
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <div className="h-10 bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(items)].map((_, i) => (
        <div
          key={i}
          className="flex gap-4 items-center bg-dark-light p-4 rounded-lg"
        >
          <div className="h-16 w-16 bg-gray-700 rounded-lg flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}
