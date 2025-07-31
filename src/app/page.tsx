import { Suspense } from 'react'
import { ProductManager } from '@/components/ProductManager'
import { xmlService } from '@/lib/xml-service'
import { getLastUpdatedTime } from '@/lib/database' // Loading component

// Loading component
function ProductsLoading() {
   return (
      <div className="container mx-auto px-3 py-10">
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
               </div>
               <div className="flex gap-2">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
               </div>
            </div>
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
         </div>
      </div>
   )
}

// Error component
function ProductsError({ error }: { error: string }) {
   return (
      <div className="container mx-auto px-3">
         <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
               Failed to Load Products
            </h2>
            <p className="text-red-700">{error}</p>
            <button
               onClick={() => window.location.reload()}
               className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
               Try Again
            </button>
         </div>
      </div>
   )
}

// Server component to fetch data
async function ProductsContent() {
   try {
      const [products, lastUpdated] = await Promise.all([
         xmlService.fetchAndParseXml(),
         getLastUpdatedTime(),
      ])

      return (
         <div className="container mx-auto px-3 py-10">
            <ProductManager initialData={products} lastUpdated={lastUpdated} />
         </div>
      )
   } catch (error) {
      console.error('Failed to fetch XML data:', error)
      return (
         <ProductsError
            error={
               error instanceof Error ? error.message : 'Unknown error occurred'
            }
         />
      )
   }
}

// Main page component
export default function HomePage() {
   return (
      <Suspense fallback={<ProductsLoading />}>
         <ProductsContent />
      </Suspense>
   )
}
