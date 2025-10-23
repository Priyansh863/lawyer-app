"use client"

import { format } from "date-fns";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MoreHorizontal, Loader2, Search, Filter } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useSelector } from "react-redux"
import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { getQAItems, deleteQuestion, type QAQuestion } from "@/lib/api/qa-api"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export default function QAListWithSearch() {
  const user = useSelector((state: any) => state.auth.user);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { t } = useTranslation()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const questionsData = await getQAItems();
        console.log(questionsData,"questionsDataquestionsDataquestionsDataquestionsData");
        setQuestions(questionsData);
        setFilteredQuestions(questionsData);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError(t("pages:qa.errors.loadFailed") || "Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Filter questions based on search term and status
  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, statusFilter]);

  const filterQuestions = () => {
    let filtered = questions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(question => {
        const questionText = question.question.toLowerCase();
        const answerText = question.answer?.map(ans => ans.answer).join(' ').toLowerCase() || '';
        const lawyerNames = question.answer?.map(ans => ans.lawyer_name).join(' ').toLowerCase() || '';
        const authorName = `${question.clientId?.first_name || ''} ${question.clientId?.last_name || ''}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return questionText.includes(searchLower) ||
               answerText.includes(searchLower) ||
               lawyerNames.includes(searchLower) ||
               authorName.includes(searchLower);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'answered') {
        filtered = filtered.filter(question => question.answer && question.answer.length > 0);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(question => !question.answer || question.answer.length === 0);
      }
    }

    setFilteredQuestions(filtered);
  };

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
      if (question?.answer && question.answer.length > 0) {
        setError(t("pages:qa.errors.cannotDeleteAnswered") || "Cannot delete answered questions");
        return;
      }

      setDeleteLoading(questionId);
      
      const success = await deleteQuestion(questionId);
      
      if (success) {
        setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionId));
        setFilteredQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionId));
      } else {
        setError(t("pages:qa.errors.deleteFailed") || "Failed to delete question");
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
      setError(t("pages:qa.errors.deleteFailedTryAgain") || "Failed to delete question. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Skeleton height={40} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={150} height={40} />
          </div>
        </div>
        
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
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('pages:qa.search.placeholder') || 'Search questions and answers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('pages:qa.filter.placeholder') || 'Filter by status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pages:qa.filter.all') || 'All Questions'}</SelectItem>
                <SelectItem value="answered">{t('pages:qa.filter.answered') || 'Answered'}</SelectItem>
                <SelectItem value="pending">{t('pages:qa.filter.pending') || 'Pending'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('pages:qa.search.placeholder') || 'Search questions and answers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('pages:qa.filter.placeholder') || 'Filter by status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pages:qa.filter.all') || 'All Questions'}</SelectItem>
                <SelectItem value="answered">{t('pages:qa.filter.answered') || 'Answered'}</SelectItem>
                <SelectItem value="pending">{t('pages:qa.filter.pending') || 'Pending'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 bg-gray-50 text-gray-700 rounded-md">
           {t("pages:qa.empty") || "No questions have been asked yet."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('pages:qa.search.placeholder') || 'Search questions and answers...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('pages:qa.filter.placeholder') || 'Filter by status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages:qa.filter.all') || 'All Questions'}</SelectItem>
              <SelectItem value="answered">{t('pages:qa.filter.answered') || 'Answered'}</SelectItem>
              <SelectItem value="pending">{t('pages:qa.filter.pending') || 'Pending'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredQuestions.length === 0 
            ? t('pages:qa.search.noResults') || 'No questions found matching your search'
            : t('pages:qa.search.resultsCount', { count: filteredQuestions.length }) || `Found ${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}`
          }
        </div>
      )}

      {/* Questions List */}
      {filteredQuestions.length === 0 && searchTerm ? (
        <div className="p-4 border border-gray-200 bg-gray-50 text-gray-700 rounded-md text-center">
          {t('pages:qa.search.noResultsDetailed') || 'No questions found matching your search criteria. Try adjusting your search terms or filters.'}
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredQuestions.map((item, index) => (
            <AccordionItem
              key={item._id}
              value={`item-${item._id}`}
              className={`border rounded-lg overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={item.answer && item.answer.length > 0 ? "default" : "outline"}>
                        {item.answer && item.answer.length > 0 ? t("pages:qa.status.answered")  : t("pages:qa.status.pending")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t('pages:qa.byAuthorOnDate', {
                          author: `${item.clientId?.first_name} ${item.clientId?.last_name}`,
                          date: formatDate(item.createdAt)
                        }) || `by ${item.clientId?.first_name} ${item.clientId?.last_name} • ${formatDate(item.createdAt)}`}
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
                            <span className="sr-only">{t("pages:qa.menu.open") || "Open menu"}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* {!item.answer || item.answer.length === 0 ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/qa/${item._id}/answer`}>{t("pages:qa.menu.answer") || "Answer"}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(item._id)}
                                disabled={deleteLoading === item._id}
                              >
                                {deleteLoading === item._id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    {t("pages:qa.menu.deleting") || "Deleting..."}
                                  </>
                                ) : t("pages:qa.menu.delete") || "Delete"}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem disabled className="text-gray-400">
                              {t("pages:qa.menu.alreadyAnswered") || "Question already answered - cannot edit or delete"}
                            </DropdownMenuItem>
                          )} */}
                           <>
                              <DropdownMenuItem asChild>
                                <Link href={`/qa/${item._id}/answer`}>{t("pages:qa.menu.answer") || "Answer"}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(item._id)}
                                disabled={deleteLoading === item._id}
                              >
                                {deleteLoading === item._id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    {t("pages:qa.menu.deleting") || "Deleting..."}
                                  </>
                                ) : t("pages:qa.menu.delete") || "Delete"}
                              </DropdownMenuItem>
                            </>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
              <AccordionContent className="px-4 pb-4 pt-0">
                {item.answer && item.answer.length > 0 ? (
                  <div className="mt-2 space-y-4">
                    {item.answer.map((answer, index) => (
                      <div key={answer._id} className="border-l-4 border-blue-200 pl-4 py-2 bg-gray-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-700 text-sm">
                            {answer.lawyer_name}
                          </span>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {answer.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 italic text-gray-500">{t("pages:qa.unanswered") || "This question hasn't been answered yet."}</div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}