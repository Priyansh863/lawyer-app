"use client"

import { useState } from "react"
import { type QAQuestion } from "@/lib/api/qa-api"
import { MapPin } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

export default function QAClientView({
  question,
  onClose,
}: {
  question: QAQuestion
  onClose?: () => void
}) {
  const { t } = useTranslation()
  const answers = question.answer || []
  const firstAnswer = answers[0]

  const maskUser = (name?: string) => {
    if (!name) return "user***"
    if (name.length <= 3) return name + "***"
    return name.substring(0, 3) + "***"
  }

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      const date = d.toLocaleDateString("en-CA") // YYYY-MM-DD
      const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
      return `${date},${time}`
    } catch {
      return dateString
    }
  }

  const clientName = maskUser(question.clientId?.first_name || "user")
  const lawyerName = firstAnswer?.answeredBy
    ? `${firstAnswer.answeredBy.first_name} ${firstAnswer.answeredBy.last_name}`
    : firstAnswer?.lawyer_name || "Lawyer"

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden w-full">
      <div className="relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-slate-300 hover:text-slate-600 transition-colors z-10"
            type="button"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        )}

        {/* Question Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <span className="text-[#1E293B] font-bold text-[15px]">{clientName}</span>
            </div>
          </div>

          <div className="space-y-4 pr-8">
            <p className="text-[#1E293B] text-[16px] leading-relaxed font-medium">{question.question}</p>

            {question.images && question.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 my-4">
                {question.images.map((img, i) => (
                  <div key={i} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                    <img src={img} alt="attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <span className="text-[#1E293B] font-bold text-[14px]"># {question.category}</span>
              <span className="text-slate-400 text-[12px] font-medium tracking-tight">
                {question.category} / {formatDate(question.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        <div className="p-8 pt-4 flex flex-col space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <span className="text-[#1E293B] font-bold text-[15px]">{answers.length ? lawyerName : ""}</span>
          </div>

          {answers.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-slate-700 font-medium">{t("pages:qa.unanswered")}</p>
            </div>
          ) : (
            <>
              <Textarea
                value={answers.map((a) => a.answer).join("\n\n")}
                readOnly
                className="min-h-[180px] border border-slate-300 focus-visible:ring-0 p-4 text-[16px] text-[#1E293B] leading-relaxed resize-none scrollbar-hide"
              />

              {(firstAnswer?.location || firstAnswer?.images?.length) && (
                <div className="pt-2 border-t border-slate-50">
                  {firstAnswer?.location && (
                    <div className="flex items-start gap-2 text-slate-600 pt-3">
                      <MapPin size={18} className="text-blue-500" />
                      <span className="text-sm font-medium">{firstAnswer.location}</span>
                    </div>
                  )}

                  {firstAnswer?.images?.length ? (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {firstAnswer.images.slice(0, 6).map((img, i) => (
                        <div key={i} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                          <img src={img} alt="attachment" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

