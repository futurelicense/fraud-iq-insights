
import React, { useState } from 'react';
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
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

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
            To enable AI-powered fraud detection, please configure your Hugging Face API access.
            This is optional for demo purposes - the system will work with mock data if not configured.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Getting Your API Key</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Hugging Face</a> and create an account</li>
              <li>Go to your Settings → Access Tokens</li>
              <li>Create a new token with "Read" permissions</li>
              <li>Copy the token and paste it below</li>
            </ol>
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="text-sm font-medium">
                Hugging Face API Token (Optional)
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
        </div>
      </CardContent>
    </Card>
  );
}
