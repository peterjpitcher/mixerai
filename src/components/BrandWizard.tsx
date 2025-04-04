import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash, Upload } from 'lucide-react'
import { countries, type Country } from '@/lib/countries'
import { languages, type Language } from '@/lib/languages'
import { agencyBodies, type Agency } from '@/lib/agency-bodies'

interface TeamRole {
  id: string
  name: string
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
  selectedAgencies: z.array(z.string()).min(1, 'Please select at least one agency'),
})

type BasicInfoData = z.infer<typeof basicInfoSchema>
type TeamMemberData = z.infer<typeof teamMemberSchema>
type BrandIdentityData = z.infer<typeof brandIdentitySchema>

interface BrandWizardProps {
  onComplete?: () => void
}

export default function BrandWizard({ onComplete }: BrandWizardProps) {
  const { supabase } = useSupabase()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null)
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentityData>({
    referenceUrls: [''],
    selectedAgencies: [],
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
      selectedAgencies: [],
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

  const addReferenceUrl = () => {
    setBrandIdentity({
      ...brandIdentity,
      referenceUrls: [...brandIdentity.referenceUrls, ''],
    })
  }

  const removeReferenceUrl = (index: number) => {
    setBrandIdentity({
      ...brandIdentity,
      referenceUrls: brandIdentity.referenceUrls.filter((_, i) => i !== index),
    })
  }

  const updateReferenceUrl = (index: number, value: string): void => {
    const newUrls = [...brandIdentity.referenceUrls]
    newUrls[index] = value
    setBrandIdentity({
      ...brandIdentity,
      referenceUrls: newUrls,
    })
    setBrandIdentityValue('referenceUrls', newUrls)
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBasicInfoValue('logo', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onBrandIdentitySubmit = async (data: BrandIdentityData): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      let logoUrl = null
      if (basicInfo?.logo) {
        const fileName = `${Date.now()}-${basicInfo.logo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand-logos')
          .upload(fileName, basicInfo.logo)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('brand-logos')
          .getPublicUrl(fileName)
          
        logoUrl = publicUrl
      }

      // Create the brand
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert([{
          name: basicInfo?.name,
          website_url: basicInfo?.websiteUrl,
          language: basicInfo?.language,
          country: basicInfo?.country,
          logo_url: logoUrl,
          settings: {
            referenceUrls: data.referenceUrls,
            agencyBodies: data.selectedAgencies,
            tone: 'professional',
            brandIdentity: '',
            doNotSay: [],
            workflowStages: ['draft', 'review', 'approved', 'published'],
          },
        }])
        .select()
        .single()

      if (brandError) throw brandError

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
                id="language"
                {...registerBasicInfo('language')}
                className={basicInfoErrors.language ? 'border-red-500' : ''}
              >
                <option value="">Select a language</option>
                {languages.map((lang: Language) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
              {basicInfoErrors.language && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.language.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                id="country"
                {...registerBasicInfo('country')}
                className={basicInfoErrors.country ? 'border-red-500' : ''}
              >
                <option value="">Select a country</option>
                {countries.map((country: Country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
              {basicInfoErrors.country && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.country.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="logo">Brand Logo</Label>
              <div className="mt-1 flex items-center space-x-4">
                <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <span className="mt-2 block text-sm text-gray-500">Upload logo</span>
                    </div>
                  )}
                </label>
              </div>
              {basicInfoErrors.logo && (
                <p className="text-sm text-red-500 mt-1">{basicInfoErrors.logo.message}</p>
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
                Provide up to 10 URLs that represent your brand's identity and tone of voice.
                We'll analyze these to help create your brand guidelines.
              </p>

              {brandIdentity.referenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateReferenceUrl(index, e.target.value)}
                    placeholder="https://example.com/content"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReferenceUrl(index)}
                    disabled={index === 0 && brandIdentity.referenceUrls.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {brandIdentityErrors.referenceUrls && (
                <p className="text-sm text-red-500">{brandIdentityErrors.referenceUrls.message}</p>
              )}

              {brandIdentity.referenceUrls.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addReferenceUrl}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reference URL
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Regulatory Bodies</h3>
              <p className="text-sm text-gray-500">
                Select the relevant regulatory bodies for your content validation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {agencyBodies[basicInfo?.country || 'default']?.map(agency => (
                  <label key={agency.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={agency.id}
                      checked={brandIdentity.selectedAgencies.includes(agency.id)}
                      onChange={(e) => {
                        const newAgencies = e.target.checked
                          ? [...brandIdentity.selectedAgencies, agency.id]
                          : brandIdentity.selectedAgencies.filter(id => id !== agency.id)
                        setBrandIdentity({
                          ...brandIdentity,
                          selectedAgencies: newAgencies,
                        })
                        setBrandIdentityValue('selectedAgencies', newAgencies)
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{agency.name}</span>
                  </label>
                ))}
              </div>

              {brandIdentityErrors.selectedAgencies && (
                <p className="text-sm text-red-500">{brandIdentityErrors.selectedAgencies.message}</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Brand
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Brand</h1>
        <p className="text-gray-500">Set up your brand in just a few steps</p>
      </div>

      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${(currentStep / 2) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={currentStep >= 1 ? 'text-blue-500' : 'text-gray-500'}>Basic Info</span>
          <span className={currentStep >= 2 ? 'text-blue-500' : 'text-gray-500'}>Brand Identity</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep} of 2:
            {currentStep === 1 ? ' Brand Details' : ' Brand Identity & Compliance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500 mb-6">
              {error}
            </div>
          )}

          {renderStep()}
        </CardContent>
      </Card>
    </div>
  )
} 