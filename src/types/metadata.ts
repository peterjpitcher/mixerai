export interface MetadataResult {
  url: string
  pageTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  status: 'success' | 'error'
  error: string | null
}

export interface BrandMetadataContext {
  brandId: string
  brandIdentity: string
  toneOfVoice: string
  guardrails: string[]
  language: string
  country: string
}

export interface GenerateMetadataRequest {
  brandId: string
  urls: string[]
  isBulk?: boolean
}

export interface GenerateMetadataResponse {
  results: MetadataResult[]
} 