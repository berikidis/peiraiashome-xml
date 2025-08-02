'use client'

import { useState } from 'react'
import { ProductTable } from './ProductTable'
import { Button } from './ui/button'
import { ProcessedProductWithStatus } from '@/types/xml-data'
import { Database, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ProductManagerProps {
   initialData: ProcessedProductWithStatus[]
   lastUpdated: string | null
}

export function ProductManager({
   initialData,
   lastUpdated,
}: ProductManagerProps) {
   const [globalFilter, setGlobalFilter] = useState('')
   const [isUpdating, setIsUpdating] = useState(false)
   
   const handleUpdateDatabase = async () => {
      setIsUpdating(true)

      try {
         const response = await fetch('/api/update-database', {
            method: 'POST',
         })

         const result = await response.json()

         if (result.success) {
            toast.success('Database updated', {
               description: `Updated ${result.stats.updatedCount} products successfully`,
            })
         } else {
            toast.error('Update failed', {
               description: result.message || 'Failed to update database',
            })
         }
      } catch (error) {
         console.error('Database update failed:', error)
         toast.error('Update failed', {
            description:
               error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
         })
      } finally {
         setIsUpdating(false)
      }
   }

   return (
      <>
         <div className="flex h-full flex-1 flex-col gap-8">
            <div className="flex flex-col gap-1">
               <h2 className="text-2xl font-semibold tracking-tight">
                  Adam Home
               </h2>
               <p className="text-muted-foreground">
                  {lastUpdated
                     ? `Last Updated: ${new Date(lastUpdated).toLocaleString()}`
                     : 'No updates recorded yet'}
               </p>
            </div>

            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center gap-2">
                  <Input
                     placeholder="Search by title or model number"
                     value={globalFilter}
                     onChange={(event) => setGlobalFilter(event.target.value)}
                     className="max-w-sm h-8"
                  />
                  <div className="flex items-center gap-2">
                     <Button
                        onClick={handleUpdateDatabase}
                        disabled={isUpdating}
                        size="sm"
                     >
                        {isUpdating ? (
                           <Loader2 className="animate-spin" />
                        ) : (
                           <Database />
                        )}
                        Update Database
                     </Button>
                  </div>
               </div>
               <ProductTable
                  data={initialData}
                  globalFilter={globalFilter}
                  setGlobalFilter={setGlobalFilter}
               />
            </div>
         </div>
      </>
   )
}
