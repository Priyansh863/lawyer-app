"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { MarketingTemplate } from "@/types/marketing"

interface TemplateSelectorProps {
  templates: MarketingTemplate[]
  onSelectTemplate: (template: MarketingTemplate) => void
}

export default function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a Template</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-4 flex flex-col items-center">
              <div className="relative w-full h-40 mb-4">
                <Image
                  src={template.thumbnailUrl || "/placeholder.svg"}
                  alt={template.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-500">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
