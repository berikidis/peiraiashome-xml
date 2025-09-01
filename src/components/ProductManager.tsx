'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductTable } from './ProductTable'
import { Button } from './ui/button'
import { ProcessedProductWithStatus } from '@/types/xml-data'
import { SupplierConfig } from '@/lib/supplier-config'
import { Database, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface ProductManagerProps {
   initialData: ProcessedProductWithStatus[]
   lastUpdated: string | null
   suppliers: SupplierConfig[]
   currentSupplier: SupplierConfig
}

export function ProductManager({
   initialData,
   lastUpdated,
   suppliers,
   currentSupplier,
}: ProductManagerProps) {
   const [globalFilter, setGlobalFilter] = useState('')
   const [isUpdating, setIsUpdating] = useState(false)
   const router = useRouter()

   const handleSupplierChange = (supplierKey: string) => {
      // Update URL to show selected supplier
      router.push(`/?supplier=${supplierKey}`)
   }

   const handleUpdateDatabase = async () => {
      setIsUpdating(true)

      try {
         const response = await fetch('/api/update-database', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               supplier: currentSupplier.id,
            }),
         })

         const result = await response.json()

         if (result.success) {
            const { updatedCount, insertedCount, disabledCount } = result.stats
            const totalProcessed = updatedCount + insertedCount

            let description = ''
            const actions = []

            if (updatedCount > 0) {
               actions.push(`Updated ${updatedCount} existing products`)
            }
            if (insertedCount > 0) {
               actions.push(`Inserted ${insertedCount} new products`)
            }
            if (disabledCount > 0) {
               actions.push(`Disabled ${disabledCount} products`)
            }

            if (actions.length === 0) {
               description = 'No changes were made'
            } else {
               description = actions.join(', ')
            }

            toast.success(`${currentSupplier.name} database updated`, {
               description,
            })

            // Refresh the page to show updated data
            router.refresh()
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
                  XML Product Manager
               </h2>
               <p className="text-muted-foreground">
                  {lastUpdated
                     ? `Last Updated: ${new Date(lastUpdated).toLocaleString()}`
                     : 'No updates recorded yet'}
               </p>
            </div>

            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                     <Select
                        value={currentSupplier.id}
                        onValueChange={handleSupplierChange}
                     >
                        <SelectTrigger className="w-48">
                           <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                           {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                 {supplier.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <Input
                        placeholder="Search by model number"
                        value={globalFilter}
                        onChange={(event) =>
                           setGlobalFilter(event.target.value)
                        }
                        className="max-w-sm h-8"
                     />
                  </div>
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
                        Update {currentSupplier.name}
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
