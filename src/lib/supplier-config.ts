export interface SupplierConfig {
   id: string
   name: string
   supplierId: number
   xmlUrl: string
   parserType: string
}

export function getSupplierConfigs(): SupplierConfig[] {
   const suppliers: SupplierConfig[] = []

   // Adam Home (existing)
   if (process.env.ADAM_HOME_SUPPLIER_ID && process.env.ADAM_HOME_XML_URL) {
      suppliers.push({
         id: 'adamhome',
         name: process.env.ADAM_HOME_NAME || 'Adam Home',
         supplierId: parseInt(process.env.ADAM_HOME_SUPPLIER_ID),
         xmlUrl: process.env.ADAM_HOME_XML_URL,
         parserType: process.env.ADAM_HOME_PARSER || 'adamhome',
      })
   }

   // Homeline
   if (process.env.HOMELINE_SUPPLIER_ID && process.env.HOMELINE_XML_URL) {
      suppliers.push({
         id: 'homeline',
         name: process.env.HOMELINE_NAME || 'Homeline',
         supplierId: parseInt(process.env.HOMELINE_SUPPLIER_ID),
         xmlUrl: process.env.HOMELINE_XML_URL,
         parserType: process.env.HOMELINE_PARSER || 'homeline',
      })
   }

   // Add more suppliers here following the same pattern
   // if (process.env.SUPPLIER_3_SUPPLIER_ID && process.env.SUPPLIER_3_XML_URL) {
   //    suppliers.push({
   //       id: 'supplier3',
   //       name: process.env.SUPPLIER_3_NAME || 'Supplier 3',
   //       supplierId: parseInt(process.env.SUPPLIER_3_SUPPLIER_ID),
   //       xmlUrl: process.env.SUPPLIER_3_XML_URL,
   //       parserType: process.env.SUPPLIER_3_PARSER || 'supplier3'
   //    })
   // }

   return suppliers
}

export function getSupplierById(id: string): SupplierConfig | null {
   const suppliers = getSupplierConfigs()
   return suppliers.find((supplier) => supplier.id === id) || null
}

export function getSupplierByDatabaseId(
   supplierId: number
): SupplierConfig | null {
   const suppliers = getSupplierConfigs()
   return (
      suppliers.find((supplier) => supplier.supplierId === supplierId) || null
   )
}
