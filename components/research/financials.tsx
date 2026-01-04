"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FinancialInfo {
  id: number
  fiscalYear?: number | null
  revenue?: number | null
  netIncome?: number | null
  marketCap?: number | null
  stockPrice?: number | null
  revenueGrowth?: number | null
  profitMargin?: number | null
}

interface FinancialsProps {
  financials: FinancialInfo[]
  stockSymbol?: string | null
  isPublic?: boolean | null
}

function formatCurrency(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  }
  return `$${value.toLocaleString()}`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

export function Financials({ financials, stockSymbol, isPublic }: FinancialsProps) {
  const latestFinancials = financials[0]

  if (!isPublic && financials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This is a private company. Limited financial information is available.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (financials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No financial information available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Financial Information
            </CardTitle>
            <CardDescription>
              {latestFinancials.fiscalYear
                ? `FY ${latestFinancials.fiscalYear}`
                : "Latest available data"}
            </CardDescription>
          </div>
          {isPublic && stockSymbol && (
            <Badge variant="secondary">{stockSymbol}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Revenue */}
          {latestFinancials.revenue != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(latestFinancials.revenue)}
              </p>
              {latestFinancials.revenueGrowth != null && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm",
                    latestFinancials.revenueGrowth >= 0
                      ? "text-success"
                      : "text-destructive"
                  )}
                >
                  {latestFinancials.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercent(latestFinancials.revenueGrowth)} YoY
                </div>
              )}
            </div>
          )}

          {/* Net Income */}
          {latestFinancials.netIncome != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Net Income</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  latestFinancials.netIncome >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {formatCurrency(Math.abs(latestFinancials.netIncome))}
                {latestFinancials.netIncome < 0 && (
                  <span className="text-sm font-normal ml-1">(loss)</span>
                )}
              </p>
              {latestFinancials.profitMargin != null && (
                <p className="text-sm text-muted-foreground">
                  {latestFinancials.profitMargin.toFixed(1)}% margin
                </p>
              )}
            </div>
          )}

          {/* Market Cap */}
          {latestFinancials.marketCap != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Market Cap</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(latestFinancials.marketCap)}
              </p>
            </div>
          )}

          {/* Stock Price */}
          {latestFinancials.stockPrice != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Stock Price</span>
              </div>
              <p className="text-2xl font-bold">
                ${latestFinancials.stockPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Historical Data */}
        {financials.length > 1 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-4">Historical Revenue</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {financials.slice(0, 5).map((f) => (
                <div key={f.id} className="text-center">
                  <p className="text-xs text-muted-foreground">
                    FY {f.fiscalYear}
                  </p>
                  <p className="font-medium">
                    {f.revenue != null ? formatCurrency(f.revenue) : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
