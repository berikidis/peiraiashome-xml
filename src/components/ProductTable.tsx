'use client'

import { useState } from 'react'
import {
   ColumnDef,
   ColumnFiltersState,
   flexRender,
   getCoreRowModel,
   getFilteredRowModel,
   getPaginationRowModel,
   getSortedRowModel,
   SortingState,
   useReactTable,
} from '@tanstack/react-table'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProcessedProduct } from '@/types/xml-data'
import { BadgeCheck, ChevronsUpDown } from 'lucide-react'
import Image from 'next/image'
import { TablePagination } from '@/components/TablePagination'

const columns: ColumnDef<ProcessedProduct>[] = [
   {
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => <span className="text-xs">{row.index + 1}</span>,
      size: 50,
   },
   {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
         <div className="size-12 relative">
            <Image
               src={row.getValue('image')}
               alt={row.getValue('title')}
               fill
               priority
               className="rounded-lg border"
               sizes="56px"
            />
         </div>
      ),
   },
   {
      accessorKey: 'title',
      header: ({ column }) => (
         <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
         >
            Title
            <ChevronsUpDown />
         </Button>
      ),
      cell: ({ row }) => (
         <>
            <div className="max-w-80 font-medium text-xs/5 truncate">
               {row.getValue('title')}
            </div>
         </>
      ),
   },
   {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
         <div className="max-w-44">
            <div
               className="text-xs/5 truncate line-clamp-2"
               title={row.getValue('description')}
               dangerouslySetInnerHTML={{
                  __html: row.getValue('description'),
               }}
            />
         </div>
      ),
   },
   {
      accessorKey: 'model',
      header: ({ column }) => (
         <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
         >
            Model
            <ChevronsUpDown />
         </Button>
      ),
      cell: ({ row }) => (
         <div className="text-xs/5">{row.getValue('model')}</div>
      ),
   },
   {
      accessorKey: 'colors',
      header: 'Color',
      cell: ({ row }) => (
         <div className="max-w-44">
            <span
               className="text-xs/5 text-wrap"
               title={row.getValue('colors')}
            >
               {row.getValue('colors')}
            </span>
         </div>
      ),
   },
   {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => (
         <div className="text-xs/5">{row.getValue('size')}</div>
      ),
   },
   {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
         const stock = row.getValue('stock') as string

         return (
            <Badge variant="secondary">
               <BadgeCheck />
               {stock}
            </Badge>
         )
      },
   },
]

interface ProductTableProps {
   data: ProcessedProduct[]
   globalFilter: string
   setGlobalFilter: (value: string) => void
}

export function ProductTable({
   data,
   globalFilter,
   setGlobalFilter,
}: ProductTableProps) {
   const [sorting, setSorting] = useState<SortingState>([])
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
   const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 20,
   })

   const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange: setPagination,
      globalFilterFn: (row, _, filterValue) => {
         const title = String(row.getValue('title')).toLowerCase()
         const model = String(row.getValue('model')).toLowerCase()
         const searchValue = filterValue.toLowerCase()

         return title.includes(searchValue) || model.includes(searchValue)
      },
      state: {
         sorting,
         columnFilters,
         globalFilter,
         pagination,
      },
   })

   return (
      <>
         <div className="overflow-hidden rounded-md border">
            <Table>
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                           <TableHead key={header.id}>
                              {header.isPlaceholder
                                 ? null
                                 : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                   )}
                           </TableHead>
                        ))}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                        <TableRow
                           key={row.id}
                           data-state={row.getIsSelected() && 'selected'}
                        >
                           {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                 {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                 )}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell colSpan={columns.length}>
                           No results found.
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>

         <TablePagination table={table} />
      </>
   )
}
