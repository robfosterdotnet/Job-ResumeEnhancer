"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"

interface StrengthsWeaknessesProps {
  strengths: Array<{ area: string; description: string; relevanceScore?: number }>
  weaknesses: Array<{ area: string; description: string; severity?: string; suggestion: string }>
}

export function StrengthsWeaknesses({ strengths, weaknesses }: StrengthsWeaknessesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            Strengths ({strengths.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strengths.length === 0 ? (
            <p className="text-muted-foreground text-sm">No strengths identified yet.</p>
          ) : (
            strengths.map((item, index) => (
              <div key={index} className="border-l-2 border-success pl-4 py-1">
                <p className="font-medium">{item.area}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Areas for Improvement ({weaknesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weaknesses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No weaknesses identified yet.</p>
          ) : (
            weaknesses.map((item, index) => (
              <div key={index} className="border-l-2 border-warning pl-4 py-1">
                <p className="font-medium">{item.area}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                {item.suggestion && (
                  <p className="text-sm text-primary mt-2">
                    <span className="font-medium">Suggestion:</span> {item.suggestion}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
