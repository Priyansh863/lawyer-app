"use client"

import { format } from "date-fns";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MoreHorizontal, Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useSelector } from "react-redux"
import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { getQAItems, deleteQuestion, type QAQuestion } from "@/lib/api/qa-api"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export default function QAList() {
  const user = useSelector((state: any) => state.auth.user);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { t } = useTranslation()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const questionsData = await getQAItems();
        console.log(questionsData,"questionsDataquestionsDataquestionsDataquestionsData");
        setQuestions(questionsData);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (err) {
      return dateString;
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      // Check if question is already answered
      const question = questions.find(q => q._id === questionId);
      if (question?.answer) {
        setError("Cannot delete answered questions");
        return;
      }

      setDeleteLoading(questionId);
      
      const success = await deleteQuestion(questionId);
      
      if (success) {
        setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionId));
      } else {
        setError("Failed to delete question");
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
      setError("Failed to delete question. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`border rounded-lg p-4 ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton width={80} height={24} />
                  <Skeleton width={120} height={16} />
                </div>
                <Skeleton width="90%" height={20} className="mb-2" />
                <Skeleton width="70%" height={16} />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Skeleton circle width={32} height={32} />
                <Skeleton circle width={32} height={32} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 text-gray-700 rounded-md">
         {t("pages:questionA.qa.empty")}
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {questions.map((item, index) => (
        <AccordionItem
          key={item._id}
          value={`item-${item._id}`}
          className={`border rounded-lg overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={item.answer ? "default" : "outline"}>
                    {item.answer ? t("pages:qa.status.answered")  : t("pages:qa.status.pending")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    by {item.userId?.first_name} {item.userId?.last_name} • {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="text-left font-normal">{item.question}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <AccordionTrigger className="hover:no-underline p-0 ml-2" />
                {user?.account_type === "lawyer" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t("pages:qa.menu.open")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!item.answer ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/qa/${item._id}/answer`}>{t("pages:qa.menu.answer")}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteLoading === item._id}
                          >
                            {deleteLoading === item._id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                {t("pages:qa.menu.deleting")}
                              </>
                            ) : t("pages:qa.menu.delete")}
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem disabled className="text-gray-400">
                          Question already answered - cannot edit or delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
          <AccordionContent className="px-4 pb-4 pt-0">
            {item.answer ? (
              <div className="mt-2 text-gray-700">{item.answer}</div>
            ) : (
              <div className="mt-2 italic text-gray-500">{t("pages:qa.unanswered")}</div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}