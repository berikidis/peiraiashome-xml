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
import { ProcessedProductWithStatus } from '@/types/xml-data'
import {
   ArrowUp,
   BadgeCheck,
   BadgePlus,
   ChevronsUpDown,
   Dot,
   SquareArrowOutUpRight,
} from 'lucide-react'
import Image from 'next/image'
import { TablePagination } from '@/components/TablePagination'

const columns: ColumnDef<ProcessedProductWithStatus>[] = [
   {
      id: 'rowNumber',
      header: () => <div className="text-center">#</div>,
      cell: ({ row }) => (
         <div className="text-center">
            <span className="text-xs">{row.index + 1}</span>
         </div>
      ),
   },
   {
      accessorKey: 'stock',
      header: 'Stock',
      cell: () => {
         return <Dot className="text-green-600" size={35} />
      },
   },
   {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
         <div className="size-12 relative">
            <Image
               src={row.getValue('image')}
               alt={row.original.title}
               fill
               priority
               className="rounded-lg border"
               sizes="56px"
            />
         </div>
      ),
   },
   {
      id: 'titleDescription',
      header: ({ column }) => (
         <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="has-[>svg]:px-0"
         >
            Title & Description
            <ChevronsUpDown />
         </Button>
      ),
      accessorFn: (row) => row.title, // Use title for sorting
      cell: ({ row }) => {
         const title = row.original.title
         const description = row.original.description

         return (
            <div className="max-w-80">
               <div className="text-xs/5 font-medium truncate">{title}</div>
               <div
                  className="text-xs/5 text-muted-foreground line-clamp-2"
                  title={description}
                  dangerouslySetInnerHTML={{
                     __html: description,
                  }}
               />
            </div>
         )
      },
   },
   {
      accessorKey: 'model',
      header: ({ column }) => (
         <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="has-[>svg]:px-0"
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
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
         const { isNew, needsUpdate } = row.original

         if (isNew) {
            return (
               <Badge>
                  <BadgePlus />
                  New
               </Badge>
            )
         } else if (needsUpdate) {
            return (
               <Badge variant="outline">
                  <ArrowUp />
                  Please update
               </Badge>
            )
         } else {
            return (
               <Badge variant="secondary">
                  <BadgeCheck />
                  Up to date
               </Badge>
            )
         }
      },
   },
   {
      accessorKey: 'colors',
      header: 'Color',
      cell: ({ row }) => (
         <div className="max-w-44">
            <span
               className="text-xs/5 line-clamp-2 text-wrap"
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
         const product = row.original

         return (
            <a href={product.link} target="_blank" rel="noopener noreferrer">
               <SquareArrowOutUpRight size={14} />
            </a>
         )
      },
   },
]

interface ProductTableProps {
   data: ProcessedProductWithStatus[]
   globalFilter: string
   setGlobalFilter: (value: string) => void
}

export function ProductTable({
   data,
   globalFilter,
   setGlobalFilter,
}: ProductTableProps) {
   const [sorting, setSorting] = useState<SortingState>([
      { id: 'status', desc: true },
   ])
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
         const model = String(row.getValue('model')).toLowerCase()
         const searchValue = filterValue.toLowerCase()

         return model.includes(searchValue)
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
                           className={
                              row.original.isNew || row.original.needsUpdate
                                 ? 'bg-neutral-50'
                                 : ''
                           }
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
