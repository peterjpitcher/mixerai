'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash } from 'lucide-react'

interface ProductMetadata {
  title: string
  description: string
  brandId: string
  sku: string
  price: number
  salePrice?: number
  currency: string
  category: string
  subcategory?: string
  features: string[]
  specifications: Array<{
    name: string
    value: string
  }>
  images: string[]
  inventory: {
    quantity: number
    lowStockThreshold: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order'
  }
  shipping: {
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    freeShipping: boolean
    restrictions?: string[]
  }
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
  relatedProducts?: string[]
  customFields: Array<{
    name: string
    value: string
  }>
}

const currencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD']
const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Books',
  'Toys & Games',
  'Food & Beverages',
  'Other'
]

const inventoryStatuses = [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'pre_order'
]

export default function CreateProductPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [metadata, setMetadata] = useState<ProductMetadata>({
    title: '',
    description: '',
    brandId: '',
    sku: '',
    price: 0,
    currency: 'USD',
    category: '',
    features: [],
    specifications: [],
    images: [],
    inventory: {
      quantity: 0,
      lowStockThreshold: 5,
      status: 'in_stock'
    },
    shipping: {
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0
      },
      freeShipping: false,
      restrictions: []
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    },
    customFields: []
  })

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (err) {
      console.error('Error loading brands:', err)
      setError('Failed to load brands')
    }
  }

  const handleSaveProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'product',
          sku: metadata.sku,
          price: metadata.price,
          sale_price: metadata.salePrice,
          currency: metadata.currency,
          category: metadata.category,
          subcategory: metadata.subcategory,
          features: metadata.features,
          specifications: metadata.specifications,
          images: metadata.images,
          inventory: metadata.inventory,
          shipping: metadata.shipping,
          seo: metadata.seo,
          related_products: metadata.relatedProducts,
          custom_fields: metadata.customFields,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving product:', err)
      setError('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    setMetadata({
      ...metadata,
      features: [...metadata.features, '']
    })
  }

  const removeFeature = (index: number) => {
    setMetadata({
      ...metadata,
      features: metadata.features.filter((_, i) => i !== index)
    })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...metadata.features]
    newFeatures[index] = value
    setMetadata({ ...metadata, features: newFeatures })
  }

  const addSpecification = () => {
    setMetadata({
      ...metadata,
      specifications: [...metadata.specifications, { name: '', value: '' }]
    })
  }

  const removeSpecification = (index: number) => {
    setMetadata({
      ...metadata,
      specifications: metadata.specifications.filter((_, i) => i !== index)
    })
  }

  const updateSpecification = (index: number, field: 'name' | 'value', value: string) => {
    const newSpecifications = [...metadata.specifications]
    newSpecifications[index] = { ...newSpecifications[index], [field]: value }
    setMetadata({ ...metadata, specifications: newSpecifications })
  }

  const addImage = () => {
    setMetadata({
      ...metadata,
      images: [...metadata.images, '']
    })
  }

  const removeImage = (index: number) => {
    setMetadata({
      ...metadata,
      images: metadata.images.filter((_, i) => i !== index)
    })
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...metadata.images]
    newImages[index] = value
    setMetadata({ ...metadata, images: newImages })
  }

  const addCustomField = () => {
    setMetadata({
      ...metadata,
      customFields: [...metadata.customFields, { name: '', value: '' }]
    })
  }

  const removeCustomField = (index: number) => {
    setMetadata({
      ...metadata,
      customFields: metadata.customFields.filter((_, i) => i !== index)
    })
  }

  const updateCustomField = (index: number, field: 'name' | 'value', value: string) => {
    const newCustomFields = [...metadata.customFields]
    newCustomFields[index] = { ...newCustomFields[index], [field]: value }
    setMetadata({ ...metadata, customFields: newCustomFields })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <Select
              value={metadata.brandId}
              onChange={(e) => setMetadata({ ...metadata, brandId: e.target.value })}
              className="w-full"
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product Title</label>
            <Input
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="Product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Detailed product description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <Input
                value={metadata.sku}
                onChange={(e) => setMetadata({ ...metadata, sku: e.target.value })}
                placeholder="Stock keeping unit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={metadata.category}
                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                className="w-full"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={metadata.price}
                onChange={(e) => setMetadata({ ...metadata, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price (optional)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={metadata.salePrice || ''}
                onChange={(e) => setMetadata({ ...metadata, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <Select
                value={metadata.currency}
                onChange={(e) => setMetadata({ ...metadata, currency: e.target.value })}
                className="w-full"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Features</label>
            <div className="space-y-2">
              {metadata.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Product feature"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addFeature}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specifications</label>
            <div className="space-y-2">
              {metadata.specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={spec.name}
                    onChange={(e) => updateSpecification(index, 'name', e.target.value)}
                    placeholder="Specification name"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                    placeholder="Specification value"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeSpecification(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addSpecification}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Specification
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Images</label>
            <div className="space-y-2">
              {metadata.images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="Image URL"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeImage(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addImage}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Inventory</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={metadata.inventory.quantity}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    inventory: {
                      ...metadata.inventory,
                      quantity: parseInt(e.target.value)
                    }
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Low Stock Threshold</label>
                <Input
                  type="number"
                  min="0"
                  value={metadata.inventory.lowStockThreshold}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    inventory: {
                      ...metadata.inventory,
                      lowStockThreshold: parseInt(e.target.value)
                    }
                  })}
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <Select
                  value={metadata.inventory.status}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    inventory: {
                      ...metadata.inventory,
                      status: e.target.value as ProductMetadata['inventory']['status']
                    }
                  })}
                  className="w-full"
                >
                  {inventoryStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Shipping</label>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={metadata.shipping.weight}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      shipping: {
                        ...metadata.shipping,
                        weight: parseFloat(e.target.value)
                      }
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Length (cm)</label>
                  <Input
                    type="number"
                    min="0"
                    value={metadata.shipping.dimensions.length}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      shipping: {
                        ...metadata.shipping,
                        dimensions: {
                          ...metadata.shipping.dimensions,
                          length: parseFloat(e.target.value)
                        }
                      }
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width (cm)</label>
                  <Input
                    type="number"
                    min="0"
                    value={metadata.shipping.dimensions.width}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      shipping: {
                        ...metadata.shipping,
                        dimensions: {
                          ...metadata.shipping.dimensions,
                          width: parseFloat(e.target.value)
                        }
                      }
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
                  <Input
                    type="number"
                    min="0"
                    value={metadata.shipping.dimensions.height}
                    onChange={(e) => setMetadata({
                      ...metadata,
                      shipping: {
                        ...metadata.shipping,
                        dimensions: {
                          ...metadata.shipping.dimensions,
                          height: parseFloat(e.target.value)
                        }
                      }
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="freeShipping"
                  checked={metadata.shipping.freeShipping}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    shipping: {
                      ...metadata.shipping,
                      freeShipping: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="freeShipping" className="text-sm">
                  Free Shipping
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SEO</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
                <Input
                  value={metadata.seo.metaTitle}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      metaTitle: e.target.value
                    }
                  })}
                  placeholder="SEO title"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
                <Textarea
                  value={metadata.seo.metaDescription}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      metaDescription: e.target.value
                    }
                  })}
                  placeholder="SEO description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Keywords</label>
                <Textarea
                  value={metadata.seo.keywords.join(', ')}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }
                  })}
                  placeholder="Comma-separated keywords"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom Fields</label>
            <div className="space-y-2">
              {metadata.customFields.map((field, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={field.name}
                    onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                    placeholder="Field name"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                    placeholder="Field value"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeCustomField(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCustomField}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Field
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={loading || !metadata.title || !metadata.brandId || !metadata.sku || !metadata.price}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 