import mysql, { PoolOptions } from 'mysql2/promise'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

const poolConfig: PoolOptions = {
   host: process.env.DB_HOST,
   port: parseInt(process.env.DB_PORT || '3306'),
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,

   waitForConnections: true,
   connectionLimit: 10,
   maxIdle: 10,
   idleTimeout: 60000,
   queueLimit: 0,

   // Security and performance
   enableKeepAlive: true,
   ssl:
      process.env.NODE_ENV === 'production'
         ? {
              minVersion: 'TLSv1.2',
              rejectUnauthorized: true,
           }
         : undefined,
}

const pool = mysql.createPool(poolConfig)

export async function executeQuery<T extends RowDataPacket>(
   query: string,
   params: any[] = []
): Promise<T[]> {
   const [rows] = await pool.execute<T[]>(query, params)
   return rows
}

export interface ProductRow extends RowDataPacket {
   product_id: number
   model: string
   date_modified: string
   status: number
}

export async function findProductByModel(
   model: string
): Promise<ProductRow | null> {
   // Only look for products from Adam Home supplier (supplier_id = 12)
   const results = await executeQuery<ProductRow>(
      'SELECT product_id, model, status FROM 1c0p_product WHERE model = ? AND supplier_id = 12 LIMIT 1',
      [model]
   )
   return results[0] || null
}

export async function insertNewProduct(
   title: string,
   description: string,
   priceWithVat: number,
   priceWithoutVat: number,
   imageLink: string,
   model: string,
   size: string
): Promise<number | null> {
   const connection = await pool.getConnection()

   try {
      await connection.beginTransaction()

      // Insert into 1c0p_product table (status = 1 for active, xml_flag = 1 for XML products)
      const [productResult] = await connection.execute<ResultSetHeader>(
         `INSERT INTO 1c0p_product (
            xml_flag, gablias_flag, teoran, model, sku, upc, ean, jan, isbn, mpn,
            location, quantity, stock_status_id, image, manufacturer_id, supplier_id,
            shipping, price, points, tax_class_id, date_available, weight, weight_class_id,
            length, width, height, length_class_id, subtract, minimum, sort_order,
            status, viewed, date_added, date_modified, skip_import, smp_related_products,
            smp_url_category_id
         ) VALUES (
                     1, 0, 0, ?, '', '', '', '', '', ?,
                     '', 0, 7, ?, 12, 12,
                     1, ?, 0, 9, '0000-00-00', 0.00000000, 0,
                     0.00000000, 0.00000000, 0.00000000, 0, 1, 1, 0,
                     1, 0, CONVERT_TZ(NOW(), '+00:00', '+03:00'), CONVERT_TZ(NOW(), '+00:00', '+03:00'), 0, 0,
                     NULL
                  )`,
         [model, model, imageLink, priceWithVat]
      )

      const productId = productResult.insertId

      // Insert into 1c0p_product_description table (language_id = 2)
      await connection.execute(
         `INSERT INTO 1c0p_product_description (
            product_id, language_id, name, meta_title, smp_h1_title, description, tag,
            meta_description, meta_keyword, meta_title_ag, smp_h1_title_ag, meta_keyword_ag,
            meta_description_ag, tag_ag, smp_alt_images, smp_alt_images_ag, smp_title_images,
            smp_title_images_ag, url_alias_exists, description_ag
         ) VALUES (?, 2, ?, ?, ?, ?, '', '', '', '0', '0', '0', '0', '0', '', '0', '', '0', '', '0')`,
         [productId, title, title, title, description]
      )

      // Insert into 1c0p_product_special table
      await connection.execute(
         `INSERT INTO 1c0p_product_special (
            product_id, customer_group_id, price, date_start, date_end, priority
         ) VALUES (?, 0, ?, '0000-00-00', '0000-00-00', 1)`,
         [productId, priceWithoutVat]
      )

      // Insert into 1c0p_product_attribute table (attribute_id = 17 for size)
      if (size && size.trim()) {
         await connection.execute(
            `INSERT INTO 1c0p_product_attribute (
               product_id, attribute_id, language_id, text
            ) VALUES (?, 17, 2, ?)`,
            [productId, size]
         )
      }

      // Insert into 1c0p_product_to_category table (category_id = 217 for adamhome_hidden)
      await connection.execute(
         `INSERT INTO 1c0p_product_to_category (
            product_id, category_id
         ) VALUES (?, 217)`,
         [productId]
      )

      await connection.commit()
      return productId
   } catch (error) {
      await connection.rollback()
      console.error('New product insertion error:', error)
      return null
   } finally {
      connection.release()
   }
}

export async function updateProductDescription(
   productId: number,
   title: string,
   description: string,
   priceWithVat: number,
   priceWithoutVat: number,
   imageLink: string,
   size: string
): Promise<boolean> {
   try {
      // Update product description
      const [descResult] = await pool.execute<ResultSetHeader>(
         `UPDATE 1c0p_product_description
          SET name         = ?,
              meta_title   = ?,
              smp_h1_title = ?,
              description  = ?
          WHERE product_id = ?
            AND language_id = 2`,
         [title, title, title, description, productId]
      )

      // Update product price, image, date_modified and re-enable if disabled
      await pool.execute(
         `UPDATE 1c0p_product
          SET price         = ?,
              image         = ?,
              status        = 1,
              date_modified = CONVERT_TZ(NOW(), '+00:00', '+03:00')
          WHERE product_id = ?`,
         [priceWithVat, imageLink, productId]
      )

      // Update special price (price without VAT) in product_special table
      await pool.execute(
         `UPDATE 1c0p_product_special
          SET price = ?
          WHERE product_id = ?`,
         [priceWithoutVat, productId]
      )

      // Update product attribute text with size from XML (attribute_id = 17)
      await pool.execute(
         `UPDATE 1c0p_product_attribute
          SET text = ?
          WHERE product_id = ?
            AND attribute_id = 17`,
         [size || '', productId]
      )

      return descResult.affectedRows > 0
   } catch (error) {
      console.error('Database update error:', error)
      return false
   }
}

export async function getLastUpdatedTime(): Promise<string | null> {
   try {
      const results = await executeQuery<
         RowDataPacket & { last_updated: string }
      >(
         `SELECT MAX(date_modified) as last_updated
          FROM 1c0p_product
          WHERE status = 1 AND supplier_id = 12`
      )
      return results[0]?.last_updated || null
   } catch (error) {
      console.error('Error getting last updated time:', error)
      return null
   }
}

export async function checkProductsExistence(
   models: string[]
): Promise<Record<string, { exists: boolean; isActive: boolean }>> {
   if (models.length === 0) return {}

   const placeholders = models.map(() => '?').join(',')
   // Check for products from Adam Home supplier (supplier_id = 12) and their status
   const results = await executeQuery<ProductRow>(
      `SELECT model, status
       FROM 1c0p_product
       WHERE model IN (${placeholders}) AND supplier_id = 12`,
      models
   )

   const productMap = new Map(
      results.map((row) => [row.model, row.status === 1])
   )

   return models.reduce(
      (acc, model) => {
         const exists = productMap.has(model)
         const isActive = productMap.get(model) || false
         acc[model] = { exists, isActive }
         return acc
      },
      {} as Record<string, { exists: boolean; isActive: boolean }>
   )
}

// NEW FUNCTION: Disable products that are not in the current XML feed
// Only affects products from Adam Home supplier (supplier_id = 12)
export async function disableProductsNotInXml(
   currentXmlModels: string[]
): Promise<number> {
   if (currentXmlModels.length === 0) {
      // If no models in XML, disable only Adam Home products
      const [result] = await pool.execute<ResultSetHeader>(
         `UPDATE 1c0p_product SET status = 0 WHERE status = 1 AND supplier_id = 12`
      )
      return result.affectedRows
   }

   const placeholders = currentXmlModels.map(() => '?').join(',')
   const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE 1c0p_product
       SET status = 0
       WHERE status = 1 AND supplier_id = 12 AND model NOT IN (${placeholders})`,
      currentXmlModels
   )

   return result.affectedRows
}

export default pool
