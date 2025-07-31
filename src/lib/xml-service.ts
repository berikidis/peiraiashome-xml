import { XMLParser, XMLValidator } from 'fast-xml-parser'
import {
   ProcessedProduct,
   XmlFeed,
   XmlItem,
   XmlOptionValue,
} from '@/types/xml-data'

class XmlService {
   private parser: XMLParser

   constructor() {
      this.parser = new XMLParser({
         ignoreAttributes: false,
         attributeNamePrefix: '@_',
         textNodeName: '#text',
         parseTagValue: true,
         trimValues: true,
         processEntities: true,
         htmlEntities: true,
         parseAttributeValue: false,
      })
   }

   async fetchAndParseXml(): Promise<ProcessedProduct[]> {
      const xmlUrl = process.env.XML_FEED_URL
      if (!xmlUrl) {
         throw new Error('XML_FEED_URL is not configured')
      }

      try {
         // Fetch XML data
         const response = await fetch(xmlUrl, {
            headers: {
               'User-Agent': 'NextJS-XML-Parser/1.0',
               'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
         })

         if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
         }

         const xmlText = await response.text()

         // Validate XML
         const validation = XMLValidator.validate(xmlText, {
            allowBooleanAttributes: true,
         })

         if (validation !== true) {
            throw new Error(
               `XML Validation Error: ${validation.err.msg} at line ${validation.err.line}`
            )
         }

         // Parse XML
         const xmlObject: XmlFeed = this.parser.parse(xmlText)

         // Process items
         return this.processXmlItems(xmlObject)
      } catch (error) {
         console.error('XML fetch/parse error:', error)
         throw error
      }
   }

   private processXmlItems(xmlObject: XmlFeed): ProcessedProduct[] {
      const channel = xmlObject.rss.channel
      const items = Array.isArray(channel.item) ? channel.item : [channel.item]

      return items
         .map((item) => this.processXmlItem(item))
         .filter((product) => {
            // Filter out products that are out of stock
            const stock = product.stock.toLowerCase()
            return stock.includes('in stock') || stock.includes('available')
         })
   }

   private processXmlItem(item: XmlItem): ProcessedProduct {
      // Extract colors from options
      let colors = 'N/A'
      if (item.option && item.option.option_name === 'ΧΡΩΜΑ') {
         const optionValues = Array.isArray(item.option.option_value)
            ? item.option.option_value
            : [item.option.option_value]

         colors = optionValues
            .map((value: XmlOptionValue) => value.option_value_name)
            .join(', ')
      }

      // Clean title from CDATA
      const cleanTitle = this.cleanCDATA(item.title)

      // Extract stock status
      const stock = this.cleanCDATA(item.availability)

      return {
         image: item.image_link,
         title: cleanTitle,
         model: item.model_number,
         colors,
         size: item.size,
         stock,
         // Additional fields for database operations
         price_with_vat: item.price_with_vat,
         price_without_vat: item.price_without_vat,
         description: this.cleanCDATA(item.description),
         category: this.cleanCDATA(item.category),
         link: item.link,
      }
   }

   private cleanCDATA(text: string): string {
      if (!text) return ''
      // Remove CDATA wrapper if present
      return text.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
   }
}

export const xmlService = new XmlService()
