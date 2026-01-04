"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterviewQuestion {
  id?: number
  question: string
  category: string | null
  suggestedAnswer: string | null
  difficulty: "easy" | "medium" | "hard" | null
}

interface InterviewQuestionsProps {
  questions: InterviewQuestion[]
}

const difficultyColors = {
  easy: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  hard: "bg-destructive/10 text-destructive",
}

const categories = [
  "all",
  "behavioral",
  "technical",
  "situational",
  "role-specific",
  "company-fit",
]

export function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [showAllAnswers, setShowAllAnswers] = useState(false)

  const filteredQuestions =
    activeCategory === "all"
      ? questions
      : questions.filter((q) => q.category?.toLowerCase() === activeCategory)

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] =
      cat === "all"
        ? questions.length
        : questions.filter((q) => q.category?.toLowerCase() === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Interview Preparation ({questions.length} Questions)
            </CardTitle>
            <CardDescription>
              Likely questions based on the job description and your resume
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllAnswers(!showAllAnswers)}
          >
            {showAllAnswers ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Answers
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show All Answers
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-6">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                disabled={categoryCounts[cat] === 0}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize"
              >
                {cat === "all" ? "All" : cat.replace("-", " ")}
                <span className="ml-1.5 text-xs opacity-70">({categoryCounts[cat]})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            {filteredQuestions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No questions in this category yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((item, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedIndex(expandedIndex === index ? null : index)
                      }
                      className="w-full p-4 flex items-start justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {item.category || "general"}
                          </Badge>
                          {item.difficulty && (
                            <Badge className={cn("text-xs", difficultyColors[item.difficulty])}>
                              {item.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{item.question}</p>
                      </div>
                      {expandedIndex === index || showAllAnswers ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </button>

                    <div
                      className={cn(
                        "transition-all duration-200 overflow-hidden",
                        expandedIndex === index || showAllAnswers
                          ? "max-h-[2000px]"
                          : "max-h-0"
                      )}
                    >
                      <div className="p-4 pt-0 border-t bg-muted/30">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Suggested Answer:
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {item.suggestedAnswer || "No suggested answer provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
