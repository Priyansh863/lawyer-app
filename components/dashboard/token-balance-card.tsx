"use client"
import React from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface TokenBalanceCardProps {
    balance: number
    valueUSD: number
}

export default function TokenBalanceCard({ balance, valueUSD }: TokenBalanceCardProps) {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <h3 className="text-[#1E293B] font-bold text-2xl tracking-tight">{t('pages:tokens.title')}</h3>
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-6"> {/* Reduced from p-10 to p-6 */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[28px] font-bold text-[#1E293B] tracking-tighter leading-none">{balance.toLocaleString()}</span>
                            <span className="text-slate-900 font-bold text-[14px] uppercase tracking-tight">{t('pages:tokens.token')}</span>
                        </div>
                        <div className="text-slate-400 text-[13px] font-bold tracking-tight mt-0.5 items-end flex flex-col"> {/* Reduced from mt-1 to mt-0.5 */}
                            <span className="opacity-0 h-0">spacer</span>
                            ${valueUSD.toFixed(0)}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end pr-1">
                <Button
                    onClick={() => router.push("/token")}
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-2 h-auto rounded-lg font-bold text-[14px] tracking-tight transition-all active:scale-95 shadow-sm"
                >
                    {t('pages:tokens.addToken')}
                </Button>
            </div>
        </div>
    )
}
