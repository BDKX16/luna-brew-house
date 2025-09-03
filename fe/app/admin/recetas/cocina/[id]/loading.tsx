export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="text-right">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="relative px-8 pb-16">
              <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse" />
              <div className="relative mt-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute transform -translate-x-1/2"
                    style={{ left: `${(i + 1) * 20}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="mt-2 space-y-1">
                        <div className="w-8 h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
