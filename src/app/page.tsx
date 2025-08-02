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

      // Check which products exist in database
      const models = products.map((p) => p.model)
      const existenceMap = await checkProductsExistence(models)

      // Add database existence status to products
      const productsWithStatus: ProcessedProductWithStatus[] = products.map(
         (product) => ({
            ...product,
            existsInDatabase: existenceMap[product.model] || false,
            isNew: !existenceMap[product.model],
         })
      )

      // Sort products: new products first, then existing ones
      const sortedProducts = productsWithStatus.sort((a, b) => {
         if (a.isNew && !b.isNew) return -1
         if (!a.isNew && b.isNew) return 1
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
