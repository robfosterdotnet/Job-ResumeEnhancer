"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { safeJsonParse } from "@/lib/utils/safe-json"
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react"

interface CompanyOverviewProps {
  company: {
    name: string
    website?: string | null
    industry?: string | null
    description?: string | null
    headquarters?: string | null
    employeeCount?: string | number | null
    foundedYear?: number | null
    isPublic?: boolean | null
    stockSymbol?: string | null
  }
  research?: {
    researchSummary?: string | null
    coreBusinessJson?: string | null
  } | null
}

interface CoreBusiness {
  products?: string
  targetMarket?: string
  competitiveAdvantage?: string
  description?: string
}

export function CompanyOverview({ company, research }: CompanyOverviewProps) {
  const coreBusiness = safeJsonParse<CoreBusiness | null>(research?.coreBusinessJson, null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{company.name}</CardTitle>
              {company.industry && (
                <Badge variant="secondary" className="mt-1">
                  {company.industry}
                </Badge>
              )}
            </div>
          </div>
          {company.isPublic && company.stockSymbol && (
            <Badge variant="default" className="text-xs">
              {company.stockSymbol}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Description */}
        {(company.description || research?.researchSummary) && (
          <p className="text-muted-foreground">
            {research?.researchSummary || company.description}
          </p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {company.headquarters && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Headquarters</p>
                <p className="text-sm font-medium">{company.headquarters}</p>
              </div>
            </div>
          )}

          {company.employeeCount && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-sm font-medium">
                  {typeof company.employeeCount === "number"
                    ? company.employeeCount.toLocaleString()
                    : company.employeeCount}
                </p>
              </div>
            </div>
          )}

          {company.foundedYear && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Founded</p>
                <p className="text-sm font-medium">{company.foundedYear}</p>
              </div>
            </div>
          )}

          {company.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Core Business - show if any relevant data exists */}
        {coreBusiness && (coreBusiness.products || coreBusiness.targetMarket || coreBusiness.competitiveAdvantage || coreBusiness.description) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Core Business
            </h4>
            <div className="space-y-2">
              {/* Fallback to description if no specific business fields */}
              {!coreBusiness.products && !coreBusiness.targetMarket && !coreBusiness.competitiveAdvantage && coreBusiness.description && (
                <p className="text-sm text-muted-foreground">{coreBusiness.description}</p>
              )}
              {coreBusiness.products && (
                <div>
                  <p className="text-xs text-muted-foreground">Products/Services</p>
                  <p className="text-sm">{coreBusiness.products}</p>
                </div>
              )}
              {coreBusiness.targetMarket && (
                <div>
                  <p className="text-xs text-muted-foreground">Target Market</p>
                  <p className="text-sm">{coreBusiness.targetMarket}</p>
                </div>
              )}
              {coreBusiness.competitiveAdvantage && (
                <div>
                  <p className="text-xs text-muted-foreground">Competitive Advantage</p>
                  <p className="text-sm">{coreBusiness.competitiveAdvantage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
