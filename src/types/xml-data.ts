export interface XmlOptionValue {
   option_value_name: string
   option_value_model: string
   option_value_price_prefix: string
   option_value_price: number
   option_value_availability: string
}

export interface XmlOption {
   option_name: string
   option_value: XmlOptionValue | XmlOptionValue[]
}

export interface XmlItem {
   title: string
   link: string
   description: string
   image_link: string
   additional_image_link?: string | string[]
   model_number: string
   price_with_vat: number
   price_without_vat: number
   start_price: number
   size: string
   category: string
   availability: string
   option?: XmlOption
}

export interface XmlChannel {
   title: string
   description: string
   link: string
   item: XmlItem | XmlItem[]
}

export interface XmlFeed {
   rss: {
      channel: XmlChannel
   }
}

// Processed data for display in table
export interface ProcessedProduct {
   image: string
   title: string
   model: string
   colors: string
   size: string
   stock: string
   // Additional fields for database operations
   price_with_vat: number
   price_without_vat: number
   description: string
   category: string
   link: string
}

export interface ProcessedProductWithStatus extends ProcessedProduct {
   existsInDatabase: boolean
   isNew: boolean
}
