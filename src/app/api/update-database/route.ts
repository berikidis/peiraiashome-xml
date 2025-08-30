import { NextRequest, NextResponse } from 'next/server'
import { xmlService } from '@/lib/xml-service'
import { findProductByModel, updateProductDescription } from '@/lib/database'

export async function POST(request: NextRequest) {
   try {
      // Fetch and process XML data
      const products = await xmlService.fetchAndParseXml()

      let updatedCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const product of products) {
         try {
            // Find product in database by model
            const dbProduct = await findProductByModel(product.model)

            if (dbProduct) {
               // Update product description, title, prices, image and attributes with data from XML
               const success = await updateProductDescription(
                  dbProduct.product_id,
                  product.title,
                  product.description,
                  product.price_with_vat,
                  product.price_without_vat,
                  product.image,
                  product.size
               )

               if (success) {
                  updatedCount++
               } else {
                  errorCount++
                  errors.push(`Failed to update product ${product.model}`)
               }
            } else {
               errors.push(
                  `Product model ${product.model} not found in database`
               )
            }
         } catch (error) {
            errorCount++
            errors.push(
               `Error processing ${product.model}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
         }
      }

      return NextResponse.json({
         success: true,
         message: `Database update completed`,
         stats: {
            totalProducts: products.length,
            updatedCount,
            errorCount,
            errors: errors.slice(0, 15),
         },
      })
   } catch (error) {
      console.error('Database update error:', error)

      return NextResponse.json(
         {
            success: false,
            error: 'Failed to update database',
            message: error instanceof Error ? error.message : 'Unknown error',
         },
         { status: 500 }
      )
   }
}
