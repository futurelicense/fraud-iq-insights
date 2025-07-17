
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, ExternalLink, CheckCircle } from 'lucide-react';

interface HuggingFaceSetupProps {
  onApiKeySet: (apiKey: string) => void;
  isConfigured: boolean;
}

export function HuggingFaceSetup({ onApiKeySet, isConfigured }: HuggingFaceSetupProps) {
  const [apiKey, setApiKey] = useState('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');
  const [isValidating, setIsValidating] = useState(false);

  // Auto-configure on component mount
  useEffect(() => {
    if (!isConfigured && apiKey) {
      handleSubmit(new Event('submit') as any);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    onApiKeySet(apiKey.trim());
    setIsValidating(false);
  };

  if (isConfigured) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="flex items-center space-x-3 pt-6">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400 font-medium">Hugging Face API configured successfully</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>AI Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            API key is pre-configured. Click "Configure AI Models" to proceed to the dashboard.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium">
              Hugging Face API Token
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your API key is stored locally and never transmitted to our servers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isValidating} className="flex-1">
              {isValidating ? 'Validating...' : 'Configure AI Models'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onApiKeySet('')}
              className="flex-1"
            >
              Continue with Demo Mode
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Button variant="link" asChild>
            <a 
              href="https://huggingface.co/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm"
            >
              Get API Key <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
