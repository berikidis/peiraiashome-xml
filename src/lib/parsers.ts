// Base Parser Interface
export interface BaseXmlParser {
   fetchAndParseXml(xmlUrl: string): Promise<ProcessedProduct[]>
}

// Import existing types
import { ProcessedProduct } from '@/types/xml-data'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

// Adam Home Parser (existing logic)
export class AdamHomeParser implements BaseXmlParser {
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

   async fetchAndParseXml(xmlUrl: string): Promise<ProcessedProduct[]> {
      try {
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

         const validation = XMLValidator.validate(xmlText, {
            allowBooleanAttributes: true,
         })

         if (validation !== true) {
            throw new Error(
               `XML Validation Error: ${validation.err.msg} at line ${validation.err.line}`
            )
         }

         const xmlObject = this.parser.parse(xmlText)
         return this.processXmlItems(xmlObject)
      } catch (error) {
         console.error('Adam Home XML fetch/parse error:', error)
         throw error
      }
   }

   private processXmlItems(xmlObject: any): ProcessedProduct[] {
      const channel = xmlObject.rss.channel
      const items = Array.isArray(channel.item) ? channel.item : [channel.item]

      return items
         .map((item: any) => this.processXmlItem(item))
         .filter((product: ProcessedProduct) => {
            const stock = product.stock.toLowerCase()
            return stock.includes('in stock') || stock.includes('available')
         })
   }

   private processXmlItem(item: any): ProcessedProduct {
      let colors = 'N/A'
      if (item.option && item.option.option_name === 'ΧΡΩΜΑ') {
         const optionValues = Array.isArray(item.option.option_value)
            ? item.option.option_value
            : [item.option.option_value]

         colors = optionValues
            .map((value: any) => value.option_value_name)
            .join(', ')
      }

      const cleanTitle = this.cleanCDATA(item.title)
      const stock = this.cleanCDATA(item.availability)

      return {
         image: item.image_link,
         title: cleanTitle,
         model: item.model_number,
         colors,
         size: item.size,
         stock,
         price_with_vat: item.price_with_vat,
         price_without_vat: item.price_without_vat,
         description: this.cleanCDATA(item.description),
         category: this.cleanCDATA(item.category),
         link: item.link,
      }
   }

   private cleanCDATA(text: any): string {
      if (!text) return ''
      // Convert to string first, then remove CDATA wrapper if present
      const textStr = String(text)
      return textStr.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
   }
}

// Homeline Parser (new)
export class HomelineParser implements BaseXmlParser {
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

   async fetchAndParseXml(xmlUrl: string): Promise<ProcessedProduct[]> {
      try {
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

         const validation = XMLValidator.validate(xmlText, {
            allowBooleanAttributes: true,
         })

         if (validation !== true) {
            throw new Error(
               `XML Validation Error: ${validation.err.msg} at line ${validation.err.line}`
            )
         }

         const xmlObject = this.parser.parse(xmlText)
         return this.processXmlItems(xmlObject)
      } catch (error) {
         console.error('Homeline XML fetch/parse error:', error)
         throw error
      }
   }

   private processXmlItems(xmlObject: any): ProcessedProduct[] {
      const products = xmlObject.root.products
      const items = Array.isArray(products.product)
         ? products.product
         : [products.product]

      return items
         .map((item: any) => this.processXmlItem(item))
         .filter((product: ProcessedProduct) => {
            // Filter for in-stock products (Y = Yes) and products with valid model
            return (
               product.stock === 'Y' &&
               product.model &&
               product.model.trim() !== ''
            )
         })
   }

   private processXmlItem(item: any): ProcessedProduct {
      const cleanTitle = this.cleanCDATA(item.name)
      const stock = this.cleanCDATA(item.InStock)
      const colors = this.cleanCDATA(item.product_attribute_color) || 'N/A'
      const size = this.cleanCDATA(item.product_attribute_size) || ''

      // Use the actual prices from XML - no VAT calculation needed
      const priceWithVat = parseFloat(this.cleanCDATA(item.price_with_vat)) || 0
      const priceWithoutDiscount =
         parseFloat(this.cleanCDATA(item.price_without_discount)) || 0

      return {
         image: this.cleanCDATA(item.image),
         title: cleanTitle,
         model: this.cleanCDATA(item.mpn),
         colors,
         size,
         stock,
         price_with_vat: priceWithVat, // 18.36 - the sale price
         price_without_vat: priceWithoutDiscount, // 20.40 - the original price (for strikethrough)
         description: this.cleanCDATA(item.description),
         category: this.cleanCDATA(item.category),
         link: this.cleanCDATA(item.link),
      }
   }

   private cleanCDATA(text: any): string {
      if (!text) return ''
      // Convert to string first, then remove CDATA wrapper if present
      const textStr = String(text)
      return textStr.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
   }
}

// Parser Factory
export class XmlParserFactory {
   static createParser(parserType: string): BaseXmlParser {
      switch (parserType.toLowerCase()) {
         case 'adamhome':
            return new AdamHomeParser()
         case 'homeline':
            return new HomelineParser()
         default:
            throw new Error(`Unknown parser type: ${parserType}`)
      }
   }
}
