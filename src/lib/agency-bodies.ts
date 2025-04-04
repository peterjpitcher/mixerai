export interface Agency {
  id: string
  name: string
  description: string
  url: string
}

interface AgencyBodiesByCountry {
  [key: string]: Agency[]
  default: Agency[]
}

export const agencyBodies: AgencyBodiesByCountry = {
  GB: [
    {
      id: 'asa',
      name: 'Advertising Standards Authority (ASA)',
      description: 'UK\'s independent advertising regulator',
      url: 'https://www.asa.org.uk/'
    },
    {
      id: 'fsa',
      name: 'Food Standards Agency (FSA)',
      description: 'UK government department responsible for food safety',
      url: 'https://www.food.gov.uk/'
    },
    {
      id: 'mhra',
      name: 'Medicines and Healthcare products Regulatory Agency (MHRA)',
      description: 'UK agency responsible for medicines and medical devices',
      url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency'
    }
  ],
  US: [
    {
      id: 'ftc',
      name: 'Federal Trade Commission (FTC)',
      description: 'US consumer protection agency',
      url: 'https://www.ftc.gov/'
    },
    {
      id: 'fda',
      name: 'Food and Drug Administration (FDA)',
      description: 'US agency responsible for food and drug safety',
      url: 'https://www.fda.gov/'
    },
    {
      id: 'fcc',
      name: 'Federal Communications Commission (FCC)',
      description: 'US communications regulator',
      url: 'https://www.fcc.gov/'
    }
  ],
  default: [
    {
      id: 'general_advertising',
      name: 'General Advertising Guidelines',
      description: 'Basic advertising standards and best practices',
      url: 'https://example.com/advertising-guidelines'
    },
    {
      id: 'content_safety',
      name: 'Content Safety Standards',
      description: 'General content safety and compliance guidelines',
      url: 'https://example.com/content-safety'
    }
  ]
  // Add more countries and agencies as needed
} 