import AIMarketingLayout from "@/components/layouts/ai-marketing-layout"
import AIMarketingHeader from "@/components/ai-marketing/ai-marketing-header"
import MarketingHistory from "@/components/ai-marketing/marketing-history"
import MarketingAnalytics from "@/components/ai-marketing/marketing-analytics"

export default function AIMarketingHistoryPage() {
  return (
    <AIMarketingLayout>
      <div className="flex flex-col gap-6">
        <AIMarketingHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketingHistory />
          <MarketingAnalytics />
        </div>
      </div>
    </AIMarketingLayout>
  )
}
