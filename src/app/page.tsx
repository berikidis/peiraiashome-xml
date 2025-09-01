import { Suspense } from 'react'
import { ProductManager } from '@/components/ProductManager'
import { xmlService } from '@/lib/xml-service'
import { checkProductsExistence, getLastUpdatedTime } from '@/lib/database'
import { getSupplierConfigs } from '@/lib/supplier-config'
import { ProcessedProductWithStatus } from '@/types/xml-data'

interface ProductsContentProps {
   supplierKey: string
}

async function ProductsContent({ supplierKey }: ProductsContentProps) {
   try {
      const suppliers = getSupplierConfigs()
      const currentSupplier = suppliers.find((s) => s.id === supplierKey)

      if (!currentSupplier) {
         throw new Error(`Supplier ${supplierKey} not found`)
      }

      const [products, lastUpdated] = await Promise.all([
         xmlService.fetchAndParseXmlForSupplier(supplierKey),
         getLastUpdatedTime(currentSupplier.supplierId),
      ])

      // Check which products exist in database and their status
      const models = products.map((p) => p.model)
      const existenceMap = await checkProductsExistence(
         models,
         currentSupplier.supplierId
      )

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
               suppliers={suppliers}
               currentSupplier={currentSupplier}
            />
         </div>
      )
   } catch (error) {
      console.error('Failed to fetch XML data:', error)
      return (
         <div className="w-custom mx-auto px-3 py-10">
            <div className="text-center py-10">
               <p className="text-destructive">
                  Failed to load products:{' '}
                  {error instanceof Error ? error.message : 'Unknown error'}
               </p>
            </div>
         </div>
      )
   }
}

export default function HomePage({
   searchParams,
}: {
   searchParams: { supplier?: string }
}) {
   // Default to Adam Home if no supplier specified
   const supplierKey = searchParams.supplier || 'adamhome'

   return (
      <Suspense fallback={'Loading...'}>
         <ProductsContent supplierKey={supplierKey} />
      </Suspense>
   )
}
