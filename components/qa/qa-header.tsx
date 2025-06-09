"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function QAHeader() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Q&A</h1>
        <p className="text-sm text-gray-500">Answer user-submitted legal questions</p>
      </div>
      <Button onClick={() => router.push("/qa/new")} className="flex items-center gap-2">
        <PlusCircle size={16} />
        <span>Add Question</span>
      </Button>
    </div>
  )
}
