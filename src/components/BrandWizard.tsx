'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash, Upload, Trash2, Sparkles } from 'lucide-react'
import { countries, type Country } from '@/lib/countries'
import { languages, type Language } from '@/lib/languages'
import Image from 'next/image'
import { isValidUrl } from '@/lib/scraper'

interface TeamRole {
  id: string
  name: string
}

interface UrlInput {
  url: string
  isValid: boolean
}

interface CustomAgency {
  id: string
  name: string
  isCustom: true
}

interface AgencyRecommendation {
  id: string;
  name: string;
  priority: 1 | 2 | 3;
  description: string;
}

interface AgencyResponse {
  agencies: AgencyRecommendation[];
}

const teamRoles: TeamRole[] = [
  { id: 'reviewer', name: 'Content Reviewer' },
  { id: 'editor', name: 'Content Editor' },
  { id: 'seo_reviewer', name: 'SEO Reviewer' },
  { id: 'publisher', name: 'Publisher' },
  { id: 'brand_manager', name: 'Brand Manager' },
]

const basicInfoSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  websiteUrl: z.string().url('Please enter a valid URL'),
  language: z.string().min(1, 'Please select a language'),
  country: z.string().min(1, 'Please select a country'),
  logo: z.any().optional(),
})

const teamMemberSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['reviewer', 'editor', 'seo_reviewer', 'publisher', 'brand_manager']),
})

const brandIdentitySchema = z.object({
  referenceUrls: z.array(z.string().url('Please enter a valid URL')).min(1, 'Please add at least one reference URL'),
  brandIdentity: z.string().min(1, 'Brand identity is required'),
  toneOfVoice: z.string().min(1, 'Tone of voice is required'),
  guardrails: z.array(z.string()).optional()
})

const regulatorySchema = z.object({
  selectedAgencies: z.array(z.string()).min(1, 'Please select at least one agency'),
  customAgencies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    isCustom: z.literal(true)
  })).optional()
})

type BasicInfoData = z.infer<typeof basicInfoSchema>
type TeamMemberData = z.infer<typeof teamMemberSchema>
type BrandIdentityData = z.infer<typeof brandIdentitySchema>
type RegulatoryData = z.infer<typeof regulatorySchema>

interface BrandWizardProps {
  onComplete?: () => void
}

export default function BrandWizard({ onComplete }: BrandWizardProps) {
  const { supabase, user } = useSupabase()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null)
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentityData>({
    referenceUrls: [''],
    brandIdentity: '',
    toneOfVoice: '',
    guardrails: []
  })
  const [regulatory, setRegulatory] = useState<RegulatoryData>({
    selectedAgencies: [],
    customAgencies: []
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [urlInputs, setUrlInputs] = useState<UrlInput[]>([{ url: '', isValid: false }])
  const [newAgencyName, setNewAgencyName] = useState('')
  const [recommendedAgencies, setRecommendedAgencies] = useState<AgencyRecommendation[]>([])

  const {
    register: registerBasicInfo,
    handleSubmit: handleBasicInfoSubmit,
    formState: { errors: basicInfoErrors },
    setValue: setBasicInfoValue,
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
  })

  const {
    register: registerBrandIdentity,
    handleSubmit: handleBrandIdentitySubmit,
    formState: { errors: brandIdentityErrors },
    setValue: setBrandIdentityValue,
  } = useForm<BrandIdentityData>({
    resolver: zodResolver(brandIdentitySchema),
    defaultValues: {
      referenceUrls: [''],
      brandIdentity: '',
      toneOfVoice: '',
      guardrails: []
    },
  })

  const {
    register: registerRegulatory,
    handleSubmit: handleRegulatorySubmit,
    formState: { errors: regulatoryErrors },
    setValue: setRegulatoryValue,
  } = useForm<RegulatoryData>({
    resolver: zodResolver(regulatorySchema),
    defaultValues: {
      selectedAgencies: [],
      customAgencies: []
    },
  })

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const onBasicInfoSubmit = async (data: BasicInfoData) => {
    setBasicInfo(data)
    handleNext()
  }

  const handleUrlChange = (index: number, value: string) => {
    const newInputs = [...urlInputs]
    const isValid = isValidUrl(value)
    newInputs[index] = { url: value, isValid }
    setUrlInputs(newInputs)
    
    // Update the form's referenceUrls field
    const validUrls = newInputs
      .filter(input => input.isValid)
      .map(input => input.url)
    setBrandIdentityValue('referenceUrls', validUrls)
  }

  const addUrlInput = () => {
    if (urlInputs.length < 10) {
      setUrlInputs([...urlInputs, { url: '', isValid: false }])
    }
  }

  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) {
      const newInputs = urlInputs.filter((_, i) => i !== index)
      setUrlInputs(newInputs)
    }
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size must be less than 2MB')
      return
    }

    // Check file type
    if (!['image/png', 'image/svg+xml'].includes(file.type)) {
      setError('Logo must be in PNG or SVG format')
      return
    }

    // For PNG files, check dimensions
    if (file.type === 'image/png') {
      const img = document.createElement('img')
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        if (img.width < 400 || img.height < 400) {
          setError('Logo dimensions must be at least 400x400 pixels')
          return
        }
        
        // If all validations pass, set the logo
        setBasicInfoValue('logo', file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoPreview(reader.result as string)
          setError(null)
        }
        reader.readAsDataURL(file)
      }

      img.src = objectUrl
    } else {
      // For SVG files, proceed directly
      setBasicInfoValue('logo', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateIdentity = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Get valid URLs
      const validUrls = urlInputs
        .filter(input => input.isValid)
        .map(input => input.url)

      if (validUrls.length === 0) {
        setError('Please add at least one valid reference URL')
        return
      }

      // Generate brand identity using the selected language and country
      const response = await fetch('/api/generate-brand-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: validUrls,
          language: basicInfo?.language,
          country: basicInfo?.country
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate brand identity')
      }

      const data = await response.json()

      if (data) {
        setBrandIdentity({
          ...brandIdentity,
          brandIdentity: data.brandIdentity,
          toneOfVoice: data.toneOfVoice,
          guardrails: data.guardrails
        })
        setBrandIdentityValue('brandIdentity', data.brandIdentity)
        setBrandIdentityValue('toneOfVoice', data.toneOfVoice)
        setBrandIdentityValue('guardrails', data.guardrails)
      }
    } catch (err) {
      console.error('Error generating brand identity:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate brand identity')
    } finally {
      setIsGenerating(false)
    }
  }

  const addCustomAgency = () => {
    if (!newAgencyName.trim()) return

    const customAgency: CustomAgency = {
      id: `custom-${Date.now()}`,
      name: newAgencyName.trim(),
      isCustom: true
    }

    setRegulatory(prev => ({
      ...prev,
      customAgencies: [...(prev.customAgencies || []), customAgency]
    }))

    setNewAgencyName('')
  }

  const onBrandIdentitySubmit = async (formData: BrandIdentityData) => {
    try {
      setLoading(true)
      setError(null)

      // Get valid URLs
      const validUrls = urlInputs
        .filter(input => input.isValid)
        .map(input => input.url)

      if (validUrls.length === 0) {
        setError('Please add at least one valid reference URL')
        setLoading(false)
        return
      }

      // Update the brandIdentity state with the form data
      const updatedData: BrandIdentityData = {
        ...formData,
        referenceUrls: validUrls,
        brandIdentity: formData.brandIdentity || brandIdentity.brandIdentity,
        toneOfVoice: formData.toneOfVoice || brandIdentity.toneOfVoice,
        guardrails: brandIdentity.guardrails || []
      }
      
      setBrandIdentity(updatedData)
      
      // Generate recommended agencies based on brand identity
      const response = await fetch('/api/recommend-agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: basicInfo?.name,
          brandIdentity: updatedData.brandIdentity,
          toneOfVoice: updatedData.toneOfVoice,
          language: basicInfo?.language,
          country: basicInfo?.country
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get agency recommendations')
      }

      const responseData = await response.json() as AgencyResponse
      if (responseData && Array.isArray(responseData.agencies)) {
        setRecommendedAgencies(responseData.agencies)
        handleNext()
      } else {
        throw new Error('Invalid agency recommendations format')
      }
    } catch (err) {
      console.error('Error getting agency recommendations:', err)
      setError(err instanceof Error ? err.message : 'Failed to get agency recommendations')
    } finally {
      setLoading(false)
    }
  }

  const onRegulatorySubmit = async (data: RegulatoryData) => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error('You must be logged in to create a brand')
      }

      if (!basicInfo) {
        throw new Error('Basic brand information is required')
      }

      let logoUrl = null
      if (basicInfo.logo) {
        try {
          console.log('Uploading logo...');
          // Create the bucket if it doesn't exist
          const { data: bucketData, error: bucketError } = await supabase.storage
            .createBucket('brand-logos', {
              public: true,
              allowedMimeTypes: ['image/png', 'image/svg+xml'],
              fileSizeLimit: 2097152 // 2MB
            })

          if (bucketError) {
            console.error('Bucket creation error:', bucketError);
            if (!bucketError.message.includes('already exists')) {
              throw bucketError
            }
          }

          // Upload the logo with public access
          const fileName = `${Date.now()}-${basicInfo.logo.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brand-logos')
            .upload(fileName, basicInfo.logo, {
              upsert: true,
              cacheControl: '3600',
              contentType: basicInfo.logo.type
            })

          if (uploadError) {
            console.error('Logo upload error:', uploadError);
            throw uploadError
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('brand-logos')
            .getPublicUrl(fileName)
            
          logoUrl = publicUrl
          console.log('Logo uploaded successfully:', logoUrl);
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError)
          setError('Failed to upload logo, but continuing with brand creation')
        }
      }

      console.log('Creating brand record...');
      
      // Create the brand with properly typed data
      const brandData = {
        name: basicInfo.name,
        website_url: basicInfo.websiteUrl,
        language: basicInfo.language,
        country: basicInfo.country,
        logo_url: logoUrl,
        user_id: user.id,
        settings: {
          referenceUrls: brandIdentity.referenceUrls || [],
          agencyBodies: data.selectedAgencies || [],
          brandIdentity: brandIdentity.brandIdentity || '',
          toneOfVoice: brandIdentity.toneOfVoice || '',
          guardrails: brandIdentity.guardrails || [],
          workflowStages: ['draft', 'review', 'approved', 'published'],
          customAgencies: data.customAgencies || [],
          keywords: [],
          styleGuide: {
            communicationStyle: '',
            languagePreferences: '',
            formalityLevel: '',
            writingStyle: ''
          },
          roles: [],
          allowedContentTypes: []
        }
      };

      console.log('Brand data to insert:', brandData);

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert(brandData)
        .select()
        .single()

      if (brandError) {
        console.error('Brand creation error:', brandError)
        throw new Error(brandError.message || 'Failed to create brand')
      }

      if (!brand) {
        throw new Error('No brand data returned after creation')
      }

      console.log('Brand created successfully:', brand);
      onComplete?.()
    } catch (err) {
      console.error('Error creating brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to create brand')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleBasicInfoSubmit(onBasicInfoSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                {...registerBasicInfo('name')}
                className={basicInfoErrors.name ? 'border-red-500' : ''}
              />
              {basicInfoErrors.name && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                {...registerBasicInfo('websiteUrl')}
                className={basicInfoErrors.websiteUrl ? 'border-red-500' : ''}
              />
              {basicInfoErrors.websiteUrl && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.websiteUrl.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={basicInfo?.language || ""}
                onValueChange={(value) => {
                  setBasicInfo(prev => ({ ...prev!, language: value }))
                  setBasicInfoValue('language', value)
                }}
              >
                <SelectTrigger className={basicInfoErrors.language ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang: Language) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {basicInfoErrors.language && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.language.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={basicInfo?.country || ""}
                onValueChange={(value) => {
                  setBasicInfo(prev => ({ ...prev!, country: value }))
                  setBasicInfoValue('country', value)
                }}
              >
                <SelectTrigger className={basicInfoErrors.country ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country: Country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {basicInfoErrors.country && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.country.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="logo">Brand Logo</Label>
              <p className="text-sm text-gray-500 mb-2">
                Recommended: PNG or SVG format, minimum 400x400px, maximum 2MB.
                For best results, use a square image with transparent background.
              </p>
              <div className="mt-1 flex items-center space-x-4">
                <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <input
                    type="file"
                    id="logo"
                    accept="image/png,image/svg+xml"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={128}
                      height={128}
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <span className="mt-2 block text-sm text-gray-500">Upload logo</span>
                    </div>
                  )}
                </label>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogoPreview(null)
                      setBasicInfoValue('logo', undefined)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {basicInfoErrors.logo && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.logo?.message?.toString()}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )

      case 2:
        return (
          <form onSubmit={handleBrandIdentitySubmit(onBrandIdentitySubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Reference Content</h3>
              <p className="text-sm text-gray-500">
                Provide up to 10 URLs that represent your brand&apos;s identity and tone of voice.
                We&apos;ll analyze these to help create your brand guidelines.
              </p>

              {/* Hidden input to register referenceUrls with the form */}
              <input 
                type="hidden" 
                {...registerBrandIdentity('referenceUrls')}
                value={urlInputs.filter(input => input.isValid).map(input => input.url)}
              />
              {brandIdentityErrors.referenceUrls && (
                <p className="text-sm text-red-500 mt-1">{brandIdentityErrors.referenceUrls.message}</p>
              )}

              {urlInputs.map((input, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={input.url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com/content"
                    className={input.url && !input.isValid ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrlInput(index)}
                    disabled={index === 0 && urlInputs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {urlInputs.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addUrlInput}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reference URL
                </Button>
              )}

              <Button
                type="button"
                className="w-full"
                onClick={handleGenerateIdentity}
                disabled={isGenerating || !urlInputs.some(input => input.isValid)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Brand Identity & Tone of Voice...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Brand Identity & Tone of Voice
                  </>
                )}
              </Button>

              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-gray-900">Brand Identity</Label>
                  <Textarea
                    className="font-mono text-sm h-[200px]"
                    placeholder={isGenerating ? "Generating brand identity..." : "Enter your brand identity or click 'Generate'"}
                    value={brandIdentity.brandIdentity || ''}
                    {...registerBrandIdentity('brandIdentity')}
                    onChange={(e) => {
                      const value = e.target.value
                      setBrandIdentity(prev => ({ ...prev, brandIdentity: value }))
                      setBrandIdentityValue('brandIdentity', value)
                    }}
                    rows={8}
                  />
                  {brandIdentityErrors.brandIdentity && (
                    <p className="text-sm text-red-500 mt-1">{brandIdentityErrors.brandIdentity.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-900">Tone of Voice</Label>
                  <Textarea
                    className="font-mono text-sm h-[200px]"
                    placeholder={isGenerating ? "Generating tone of voice..." : "Enter your tone of voice or click 'Generate'"}
                    value={brandIdentity.toneOfVoice || ''}
                    {...registerBrandIdentity('toneOfVoice')}
                    onChange={(e) => {
                      const value = e.target.value
                      setBrandIdentity(prev => ({ ...prev, toneOfVoice: value }))
                      setBrandIdentityValue('toneOfVoice', value)
                    }}
                    rows={8}
                  />
                  {brandIdentityErrors.toneOfVoice && (
                    <p className="text-sm text-red-500 mt-1">{brandIdentityErrors.toneOfVoice.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-900">Content Restrictions & Guardrails</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    These guardrails specify what content should NOT include.
                  </p>
                  <div className="mt-2 space-y-2">
                    {(brandIdentity.guardrails || []).map((guardrail, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                        <span className="text-sm text-gray-900">{guardrail}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => {
                            const newGuardrails = [...(brandIdentity.guardrails || [])];
                            newGuardrails.splice(index, 1);
                            const updatedBrandIdentity = {
                              ...brandIdentity,
                              guardrails: newGuardrails
                            };
                            setBrandIdentity(updatedBrandIdentity);
                            setBrandIdentityValue('guardrails', newGuardrails);
                          }}
                          disabled={isGenerating}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Add new content restriction..."
                      className="bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value) {
                            const newGuardrails = [...(brandIdentity.guardrails || []), value];
                            const updatedBrandIdentity = {
                              ...brandIdentity,
                              guardrails: newGuardrails
                            };
                            setBrandIdentity(updatedBrandIdentity);
                            setBrandIdentityValue('guardrails', newGuardrails);
                            input.value = '';
                          }
                        }
                      }}
                      disabled={isGenerating}
                    />
                    <Button
                      type="button"
                      className="bg-white hover:bg-gray-50 border-gray-200 text-gray-900"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const value = input.value.trim();
                        if (value) {
                          const newGuardrails = [...(brandIdentity.guardrails || []), value];
                          const updatedBrandIdentity = {
                            ...brandIdentity,
                            guardrails: newGuardrails
                          };
                          setBrandIdentity(updatedBrandIdentity);
                          setBrandIdentityValue('guardrails', newGuardrails);
                          input.value = '';
                        }
                      }}
                      disabled={isGenerating}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                type="submit"
                disabled={!brandIdentity.brandIdentity || !brandIdentity.toneOfVoice || !urlInputs.some(input => input.isValid)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )

      case 3:
        return (
          <form onSubmit={handleRegulatorySubmit(onRegulatorySubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Regulatory Bodies</h3>
              <p className="text-sm text-gray-500">
                Select the relevant regulatory bodies for your content validation.
                These recommendations are based on your brand&apos;s identity and industry.
              </p>

              {recommendedAgencies.length > 0 && (
                <div className="space-y-4">
                  {[1, 2, 3].map((priority) => {
                    const priorityAgencies = recommendedAgencies.filter(agency => agency.priority === priority)
                    if (priorityAgencies.length === 0) return null

                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="font-medium">
                            {priority === 1 ? 'Critical/Mandatory' :
                             priority === 2 ? 'Important' :
                             'Optional'} Agencies
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const agencyIds = priorityAgencies.map(agency => agency.id)
                              const newSelectedAgencies = new Set([...regulatory.selectedAgencies, ...agencyIds])
                              const updatedAgencies = Array.from(newSelectedAgencies)
                              setRegulatory({
                                ...regulatory,
                                selectedAgencies: updatedAgencies,
                              })
                              setRegulatoryValue('selectedAgencies', updatedAgencies)
                            }}
                          >
                            Select All
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {priorityAgencies.map(agency => (
                            <div key={agency.id} className="flex items-start space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <input
                                type="checkbox"
                                value={agency.id}
                                checked={regulatory.selectedAgencies.includes(agency.id)}
                                onChange={(e) => {
                                  const newAgencies = e.target.checked
                                    ? [...regulatory.selectedAgencies, agency.id]
                                    : regulatory.selectedAgencies.filter(id => id !== agency.id)
                                  setRegulatory({
                                    ...regulatory,
                                    selectedAgencies: newAgencies,
                                  })
                                  setRegulatoryValue('selectedAgencies', newAgencies)
                                }}
                                className="mt-1 rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{agency.name}</div>
                                <p className="text-sm text-gray-600">{agency.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Agencies</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    placeholder="Enter agency name..."
                  />
                  <Button
                    type="button"
                    onClick={addCustomAgency}
                    disabled={!newAgencyName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {regulatory.customAgencies && regulatory.customAgencies.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {regulatory.customAgencies.map(agency => (
                      <label key={agency.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={agency.id}
                          checked={regulatory.selectedAgencies.includes(agency.id)}
                          onChange={(e) => {
                            const newAgencies = e.target.checked
                              ? [...regulatory.selectedAgencies, agency.id]
                              : regulatory.selectedAgencies.filter(id => id !== agency.id)
                            setRegulatory({
                              ...regulatory,
                              selectedAgencies: newAgencies,
                            })
                            setRegulatoryValue('selectedAgencies', newAgencies)
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{agency.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {regulatoryErrors.selectedAgencies && (
              <p className="text-sm text-red-500">{regulatoryErrors.selectedAgencies.message}</p>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading || regulatory.selectedAgencies.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Brand...
                  </>
                ) : (
                  <>
                    Create Brand
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto bg-white">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Brand</h1>
        <p className="text-gray-500">Set up your brand in just a few steps</p>
      </div>

      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${(currentStep / 3) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={currentStep >= 1 ? 'text-blue-500' : 'text-gray-500'}>Basic Info</span>
          <span className={currentStep >= 2 ? 'text-blue-500' : 'text-gray-500'}>Brand Identity</span>
          <span className={currentStep >= 3 ? 'text-blue-500' : 'text-gray-500'}>Regulatory</span>
        </div>
      </div>

      <Card className="max-h-[calc(80vh-200px)] overflow-y-auto bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">
            Step {currentStep} of 3:
            {currentStep === 1 ? ' Brand Details' : 
             currentStep === 2 ? ' Brand Identity' : 
             ' Regulatory Compliance'}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 mb-6">
              {error}
            </div>
          )}

          {renderStep()}
        </CardContent>
      </Card>
    </div>
  )
} 