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
}

export async function findProductByModel(
   model: string
): Promise<ProductRow | null> {
   const results = await executeQuery<ProductRow>(
      'SELECT product_id, model FROM 1c0p_product WHERE model = ? LIMIT 1',
      [model]
   )
   return results[0] || null
}

export async function updateProductDescription(
   productId: number,
   title: string,
   description: string
): Promise<boolean> {
   try {
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

      await pool.execute(
         `UPDATE 1c0p_product
          SET date_modified = CONVERT_TZ(NOW(), '+00:00', '+03:00')
          WHERE product_id = ?`,
         [productId]
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
          FROM 1c0p_product`
      )
      return results[0]?.last_updated || null
   } catch (error) {
      console.error('Error getting last updated time:', error)
      return null
   }
}

export async function checkProductsExistence(
   models: string[]
): Promise<Record<string, boolean>> {
   if (models.length === 0) return {}

   const placeholders = models.map(() => '?').join(',')
   const results = await executeQuery<ProductRow>(
      `SELECT model
       FROM 1c0p_product
       WHERE model IN (${placeholders})`,
      models
   )

   const existingModels = new Set(results.map((row) => row.model))

   return models.reduce(
      (acc, model) => {
         acc[model] = existingModels.has(model)
         return acc
      },
      {} as Record<string, boolean>
   )
}

export default pool
