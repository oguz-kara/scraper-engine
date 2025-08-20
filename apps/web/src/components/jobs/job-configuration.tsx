'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Copy, 
  Download,
  FileText,
  Database
} from 'lucide-react';
import { useState } from 'react';

interface JobConfigurationProps {
  job: {
    id: string;
    provider: string;
    input: any;
    currentInput?: any;
    remainingInput?: any;
  };
}

export function JobConfiguration({ job }: JobConfigurationProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadConfig = () => {
    const config = {
      jobId: job.id,
      provider: job.provider,
      input: job.input,
      currentInput: job.currentInput,
      remainingInput: job.remainingInput,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${job.id}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSearchTermsCount = () => {
    if (job.input?.searchTerms && Array.isArray(job.input.searchTerms)) {
      return job.input.searchTerms.length;
    }
    return 0;
  };

  const getCurrentProgress = () => {
    const totalTerms = getSearchTermsCount();
    const remainingTerms = job.remainingInput?.searchTerms?.length || 0;
    const processedTerms = totalTerms - remainingTerms;
    return { totalTerms, processedTerms, remainingTerms };
  };

  const progress = getCurrentProgress();

  return (
    <div className="space-y-4">
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Summary
            </CardTitle>
            <Button variant="outline" size="sm" onClick={downloadConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Provider:</span>
              </div>
              <Badge variant="outline" className="text-base">
                {job.provider}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search Terms:</span>
              </div>
              <div className="text-2xl font-bold">{getSearchTermsCount()}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Progress:</span>
              </div>
              <div className="text-sm">
                {progress.processedTerms} / {progress.totalTerms} terms processed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original Input Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Original Input Configuration</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(job.input, null, 2), 'input')}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedField === 'input' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(job.input, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Current Processing Input */}
      {job.currentInput && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Currently Processing</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(job.currentInput, null, 2), 'current')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedField === 'current' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(job.currentInput, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Remaining Input */}
      {job.remainingInput && Object.keys(job.remainingInput).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Remaining Input</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(job.remainingInput, null, 2), 'remaining')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedField === 'remaining' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(job.remainingInput, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Search Terms Details */}
      {job.input?.searchTerms && Array.isArray(job.input.searchTerms) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Terms Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <div className="font-semibold text-blue-700 dark:text-blue-300">Total Terms</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {progress.totalTerms}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                  <div className="font-semibold text-green-700 dark:text-green-300">Processed</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {progress.processedTerms}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                  <div className="font-semibold text-orange-700 dark:text-orange-300">Remaining</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {progress.remainingTerms}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">All Search Terms:</h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
                  {job.input.searchTerms.map((term: string, index: number) => {
                    const isProcessed = index < progress.processedTerms;
                    return (
                      <Badge 
                        key={index}
                        variant={isProcessed ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {term}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}