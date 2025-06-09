import { Card, CardContent } from "@/components/ui/card"

interface CaseSummaryProps {
  caseId: string
}

export default function CaseSummary({ caseId }: CaseSummaryProps) {
  //  this would fetch the case summary from an API
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-medium">Case Summary</h3>
        <p>
          This is an automatically generated summary of the case. It includes key points, important dates, and relevant
          information extracted from case documents.
        </p>
        <div className="space-y-2">
          <h4 className="font-medium">Key Points:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Business settlement agreement between parties</li>
            <li>Dispute over contract terms in section 3.2</li>
            <li>Proposed resolution includes revised payment schedule</li>
            <li>Mediation scheduled for next month</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Important Dates:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contract signed: January 15, 2025</li>
            <li>Dispute filed: March 1, 2025</li>
            <li>Mediation date: June 10, 2025</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
