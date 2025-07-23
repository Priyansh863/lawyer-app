"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/useTranslation"

interface BlogHeaderProps {
  onSearch?: (query: string) => void
  onCategoryFilter?: (category: string) => void
  onStatusFilter?: (status: string) => void
  searchQuery?: string
  selectedCategory?: string
  selectedStatus?: string
}

export default function BlogHeader({
  onSearch,
  onCategoryFilter,
  onStatusFilter,
  searchQuery = "",
  selectedCategory = "all",
  selectedStatus = "all"
}: BlogHeaderProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="space-y-10 mt-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('pages:blog.title')}</h1>
        <p className="text-[10px] text-gray-500">{t('pages:blog.description')}</p>


        </div>
        <Button onClick={() => router.push("/blog/new")} className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span>{t('pages:blog.newPost')}</span>
        </Button>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('pages:blog.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={onCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('pages:blog.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages:blog.allCategories')}</SelectItem>
            <SelectItem value="legal-advice">{t('pages:blog.legalAdvice')}</SelectItem>
            <SelectItem value="case-studies">{t('pages:blog.caseStudies')}</SelectItem>
            <SelectItem value="news">{t('pages:blog.news')}</SelectItem>
            <SelectItem value="insights">{t('pages:blog.insights')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={onStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder={t('pages:blog.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages:blog.allStatus')}</SelectItem>
            <SelectItem value="published">{t('pages:blog.published')}</SelectItem>
            <SelectItem value="draft">{t('pages:blog.draft')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
