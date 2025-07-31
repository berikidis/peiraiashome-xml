import { Button } from '@/components/ui/button'
import { Table } from '@tanstack/react-table'

interface TablePaginationProps<TData> {
   table: Table<TData>
}

export function TablePagination<TData>({ table }: TablePaginationProps<TData>) {
   return (
      <div className="flex items-center justify-between px-2">
         <div className="text-muted-foreground flex-1 text-sm">
            Total products: {table.getFilteredRowModel().rows.length}
         </div>
         <div className="flex items-center space-x-2">
            <Button
               variant="outline"
               size="sm"
               onClick={() => table.previousPage()}
               disabled={!table.getCanPreviousPage()}
            >
               Previous
            </Button>
            <Button
               variant="outline"
               size="sm"
               onClick={() => table.nextPage()}
               disabled={!table.getCanNextPage()}
            >
               Next
            </Button>
         </div>
      </div>
   )
}
