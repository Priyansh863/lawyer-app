"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { generateAiPost } from '@/lib/api/posts-api';
import { useToast } from '@/hooks/use-toast';

export default function AIPostPage() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'ko'>('ko');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleGeneratePost = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await generateAiPost({
        prompt: prompt,
        language: language,
        tone: 'professional',
        includeHashtags: true
      });
      
      setGeneratedContent(response);
      toast({
        title: t('pages:aiPost.success'),
        description: t('pages:aiPost.successDescription'),
      });
    } catch (error: any) {
      console.error('Error generating AI post:', error);
      toast({
        title: t('pages:aiPost.error'),
        description: error.message || t('pages:aiPost.errorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('pages:aiPost.title')}</h1>
        <p className="text-muted-foreground">
          {t('pages:aiPost.description')}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('pages:aiPost.createNewPost')}</CardTitle>
          <CardDescription>
            {t('pages:aiPost.createNewPostDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Language Selector */}
            <div className="space-y-2">
              <Label htmlFor="language">{t('pages:aiPost.language')}</Label>
              <Select value={language} onValueChange={(value: 'en' | 'ko') => setLanguage(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('pages:aiPost.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">{t('pages:aiPost.korean')}</SelectItem>
                  <SelectItem value="en">{t('pages:aiPost.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">{t('pages:aiPost.promptLabel')}</Label>
              <Input
                id="prompt"
                type="text"
                placeholder={language === 'ko' ? t('pages:aiPost.promptPlaceholderKo') : t('pages:aiPost.promptPlaceholder')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePost()}
                disabled={isGenerating}
                className="flex-1"
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGeneratePost} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? 
                (language === 'ko' ? t('pages:aiPost.generatingKo') : t('pages:aiPost.generating')) : 
                (language === 'ko' ? t('pages:aiPost.generatePostKo') : t('pages:aiPost.generatePost'))
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ko' ? t('pages:aiPost.generatedPostKo') : t('pages:aiPost.generatedPost')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Generated Content Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  {language === 'ko' ? t('pages:aiPost.titleKo') : t('pages:aiPost.title_label')}
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  {generatedContent.title || generatedContent.data?.title || prompt}
                </p>
                
                <h3 className="font-medium mb-2">
                  {language === 'ko' ? t('pages:aiPost.contentKo') : t('pages:aiPost.content_label')}
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {generatedContent.content || generatedContent.data?.content || 'Generated content will appear here...'}
                </div>

                {/* Hashtags if available */}
                {(generatedContent.hashtags || generatedContent.data?.hashtags) && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">
                      {language === 'ko' ? t('pages:aiPost.hashtagsKo') : t('pages:aiPost.hashtags')}
                    </h3>
                    <p className="text-sm text-blue-600">
                      {generatedContent.hashtags || generatedContent.data?.hashtags}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                  {language === 'ko' ? t('pages:aiPost.generateNewKo') : t('pages:aiPost.generateNew')}
                </Button>
                <Button variant="outline">
                  {language === 'ko' ? t('pages:aiPost.copyKo') : t('pages:aiPost.copy')}
                </Button>
                <Button>
                  {language === 'ko' ? t('pages:aiPost.publishKo') : t('pages:aiPost.publish')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
