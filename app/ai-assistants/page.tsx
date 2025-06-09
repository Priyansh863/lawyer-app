import AIAssistantsLayout from "@/components/layouts/ai-assistants-layout"
import AIAssistantsHeader from "@/components/ai-assistants/ai-assistants-header"
import FileProcessor from "@/components/ai-assistants/file-processor"

export default function AIAssistantsPage() {
  return (
    <AIAssistantsLayout>
      <div className="flex flex-col gap-6">
        <AIAssistantsHeader />
        <FileProcessor />
      </div>
    </AIAssistantsLayout>
  )
}
