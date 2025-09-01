import { XmlParserFactory } from '@/lib/parsers'
import { getSupplierById, SupplierConfig } from '@/lib/supplier-config'
import { ProcessedProduct } from '@/types/xml-data'

class XmlService {
   async fetchAndParseXmlForSupplier(
      supplierKey: string
   ): Promise<ProcessedProduct[]> {
      // Get supplier configuration
      const supplierConfig = getSupplierById(supplierKey)
      if (!supplierConfig) {
         throw new Error(`Unknown supplier: ${supplierKey}`)
      }

      // Create appropriate parser for this supplier
      const parser = XmlParserFactory.createParser(supplierConfig.parserType)

      // Fetch and parse XML data
      return await parser.fetchAndParseXml(supplierConfig.xmlUrl)
   }

   // Legacy method for backward compatibility (defaults to Adam Home)
   async fetchAndParseXml(): Promise<ProcessedProduct[]> {
      return this.fetchAndParseXmlForSupplier('adamhome')
   }

   // Get all available suppliers
   getAvailableSuppliers(): SupplierConfig[] {
      const { getSupplierConfigs } = require('@/lib/supplier-config')
      return getSupplierConfigs()
   }
}

export const xmlService = new XmlService()
