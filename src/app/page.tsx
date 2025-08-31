import { Suspense } from 'react'
import { ProductManager } from '@/components/ProductManager'
import { xmlService } from '@/lib/xml-service'
import { checkProductsExistence, getLastUpdatedTime } from '@/lib/database'
import { ProcessedProductWithStatus } from '@/types/xml-data'

async function ProductsContent() {
   try {
      const [products, lastUpdated] = await Promise.all([
         xmlService.fetchAndParseXml(),
         getLastUpdatedTime(),
      ])

      // Check which products exist in database and their status
      const models = products.map((p) => p.model)
      const existenceMap = await checkProductsExistence(models)

      // Add database existence status to products
      const productsWithStatus: ProcessedProductWithStatus[] = products.map(
         (product) => {
            const dbInfo = existenceMap[product.model]
            const existsInDatabase = dbInfo?.exists || false
            const isActive = dbInfo?.isActive || false

            return {
               ...product,
               existsInDatabase,
               isNew: !existsInDatabase,
               needsUpdate: existsInDatabase && !isActive, // exists but disabled
            }
         }
      )

      // Sort products: new products first, then needs update, then up to date
      const sortedProducts = productsWithStatus.sort((a, b) => {
         if (a.isNew && !b.isNew) return -1
         if (!a.isNew && b.isNew) return 1
         if (a.needsUpdate && !b.needsUpdate) return -1
         if (!a.needsUpdate && b.needsUpdate) return 1
         return 0
      })

      return (
         <div className="w-custom mx-auto px-3 py-10">
            <ProductManager
               initialData={sortedProducts}
               lastUpdated={lastUpdated}
            />
         </div>
      )
   } catch (error) {
      console.error('Failed to fetch XML data:', error)
   }
}

export default function HomePage() {
   return (
      <Suspense fallback={'Loading...'}>
         <ProductsContent />
      </Suspense>
   )
}
