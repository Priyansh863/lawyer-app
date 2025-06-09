"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MoreHorizontal } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Updated with realistic legal Q&A data
const questions = [
  {
    id: 1,
    question:
      "What are the key considerations when filing for a trademark in multiple international jurisdictions simultaneously?",
    answer:
      "When filing for trademark protection across multiple jurisdictions, consider these key factors: First, conduct a comprehensive search in each target country to ensure availability. Second, understand the Madrid Protocol system which can streamline international registration. Third, be aware of country-specific requirements - some jurisdictions require local use or intent to use, while others have specific classification systems. Fourth, consider working with local counsel in each jurisdiction to navigate nuances. Finally, develop a strategic filing timeline that accounts for priority periods under the Paris Convention, which typically gives you 6 months from your first filing to claim priority in other countries.",
    client: "TechStartup Inc.",
    date: "Mar 24, 2025",
    status: "answered",
    likes: 5,
  },
  {
    id: 2,
    question:
      "How does the recent Supreme Court ruling on digital privacy affect my company's data collection practices?",
    answer: "",
    client: "Data Analytics Co.",
    date: "Mar 22, 2025",
    status: "pending",
    likes: 0,
  },
  {
    id: 3,
    question:
      "What legal structures should I consider when setting up a social enterprise that operates across multiple states?",
    answer:
      "For a multi-state social enterprise, consider a Public Benefit Corporation (PBC) or a traditional C-Corp with specific social mission provisions in your governing documents. PBCs are recognized in most states and allow you to pursue both profit and social impact. Alternatively, you might explore a hybrid model with a nonprofit and for-profit entity working in tandem. Each state has different requirements for foreign entity registration, so you'll need to register in each state where you conduct substantial business.",
    client: "Community Impact Ventures",
    date: "Mar 20, 2025",
    status: "answered",
    likes: 3,
  },
  {
    id: 4,
    question: "What are the legal implications of using AI-generated content in our marketing materials?",
    answer: "",
    client: "Creative Marketing Agency",
    date: "Mar 18, 2025",
    status: "pending",
    likes: 0,
  },
  {
    id: 5,
    question: "How should our company respond to a data breach to minimize legal liability?",
    answer:
      "Responding to a data breach requires immediate action: First, activate your incident response team and contain the breach. Second, document everything from discovery through resolution. Third, determine notification requirements based on applicable laws (GDPR, CCPA, state laws, etc.) and notify affected individuals, regulators, and law enforcement as required. Fourth, offer appropriate remediation to affected parties such as credit monitoring. Finally, conduct a thorough post-incident review to strengthen security measures and document compliance efforts, which can help demonstrate due diligence if litigation arises.",
    client: "Healthcare Services Inc.",
    date: "Mar 15, 2025",
    status: "answered",
    likes: 7,
  },
  {
    id: 6,
    question: "What legal considerations should we be aware of when implementing a four-day workweek?",
    answer: "",
    client: "Progressive Workplace Solutions",
    date: "Mar 12, 2025",
    status: "pending",
    likes: 0,
  },
  {
    id: 7,
    question: "How do the new environmental regulations affect our manufacturing compliance requirements?",
    answer:
      "The new environmental regulations significantly impact manufacturing compliance in three key areas: First, emissions reporting now requires quarterly rather than annual documentation with more stringent thresholds. Second, water discharge permits now mandate advanced treatment technologies for previously unregulated contaminants. Third, the extended producer responsibility provisions require manufacturers to implement take-back programs for product packaging. You should conduct a comprehensive compliance audit, update your environmental management system, and consider investing in new monitoring equipment to meet these requirements.",
    client: "Industrial Manufacturing Corp.",
    date: "Mar 10, 2025",
    status: "answered",
    likes: 2,
  },
  {
    id: 8,
    question: "What are the legal risks of allowing employees to use personal devices for work purposes?",
    answer: "",
    client: "Remote Tech Solutions",
    date: "Mar 8, 2025",
    status: "pending",
    likes: 0,
  },
]

export default function QAList() {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {questions.map((item, index) => (
        <AccordionItem
          key={item.id}
          value={`item-${item.id}`}
          className={`border rounded-lg overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={item.status === "answered" ? "default" : "outline"}>
                  {item.status === "answered" ? "Answered" : "Pending"}
                </Badge>
                <span className="text-sm text-gray-500">
                  {item.client} • {item.date}
                </span>
              </div>
              <AccordionTrigger className="hover:no-underline p-0">
                <p className="text-left font-normal">{item.question}</p>
              </AccordionTrigger>
            </div>
            <div className="flex items-center gap-2">
              {item.status === "answered" && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{item.likes}</span>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {item.status === "pending" ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/qa/${item.id}/answer`}>Answer</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href={`/qa/${item.id}/edit`}>Edit Answer</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <AccordionContent className="px-4 pb-4 pt-0">
            {item.status === "answered" ? (
              <div className="mt-2 text-gray-700">{item.answer}</div>
            ) : (
              <div className="mt-2 italic text-gray-500">This question has not been answered yet.</div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
