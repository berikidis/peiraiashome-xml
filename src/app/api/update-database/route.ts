import { NextRequest, NextResponse } from 'next/server'
import { xmlService } from '@/lib/xml-service'
import {
   disableProductsNotInXml,
   findProductByModel,
   insertNewProduct,
   updateProductDescription,
} from '@/lib/database'

export async function POST(request: NextRequest) {
   try {
      // Fetch and process XML data
      const products = await xmlService.fetchAndParseXml()

      let updatedCount = 0
      let insertedCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Extract all models from current XML feed
      const currentXmlModels = products.map((product) => product.model)

      for (const product of products) {
         try {
            // Find product in database by model
            const dbProduct = await findProductByModel(product.model)

            if (dbProduct) {
               // Update existing product description, title, prices, image and attributes with data from XML
               // This also re-enables the product if it was disabled (status = 1)
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
               // Insert new product into database in adamhome_hidden category
               const newProductId = await insertNewProduct(
                  product.title,
                  product.description,
                  product.price_with_vat,
                  product.price_without_vat,
                  product.image,
                  product.model,
                  product.size
               )

               if (newProductId) {
                  insertedCount++
               } else {
                  errorCount++
                  errors.push(`Failed to insert new product ${product.model}`)
               }
            }
         } catch (error) {
            errorCount++
            errors.push(
               `Error processing ${product.model}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
         }
      }

      // Disable products that are no longer in the XML feed
      let disabledCount = 0
      try {
         disabledCount = await disableProductsNotInXml(currentXmlModels)
      } catch (error) {
         console.error('Error disabling products not in XML:', error)
         errors.push('Failed to disable products not in XML feed')
      }

      return NextResponse.json({
         success: true,
         message: `Database update completed`,
         stats: {
            totalProducts: products.length,
            updatedCount,
            insertedCount,
            disabledCount,
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
