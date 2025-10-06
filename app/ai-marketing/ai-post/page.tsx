"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export default function AIPostPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGenerateImage = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, you would call your AI image generation API here
      // For now, we'll use a placeholder image
      setGeneratedImage('https://static.vecteezy.com/system/resources/previews/036/085/986/non_2x/ai-generated-round-empty-courtroom-with-marble-floor-and-wooden-chairs-generated-by-artificial-intelligence-free-photo.jpg' + encodeURIComponent(prompt));
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Post Generator</h1>
        <p className="text-muted-foreground">
          Generate stunning images using AI by entering a description
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Describe the image you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="A beautiful sunset over mountains..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateImage()}
                disabled={isGenerating}
                className="flex-1"
              />
              <Button 
                onClick={handleGenerateImage} 
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <img 
                src={generatedImage} 
                alt="Generated content" 
                className="rounded-lg border w-full h-auto"
              />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Download
                </Button>
                <Button>Share</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
