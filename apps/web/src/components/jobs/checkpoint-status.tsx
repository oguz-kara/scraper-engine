'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface CheckpointStatusProps {
  job: {
    id: string;
    status: string;
    checkpoints?: Array<{
      id: string;
      sequenceNumber: number;
      itemsScraped: number;
      createdAt: string;
      state?: any;
    }>;
    latestCheckpoint?: {
      id: string;
      sequenceNumber: number;
      itemsScraped: number;
      state: any;
      createdAt: string;
    };
  };
}

export function CheckpointStatus({ job }: CheckpointStatusProps) {
  const checkpoints = job.checkpoints || [];
  const latest = job.latestCheckpoint;
  const isRunning = job.status === 'RUNNING';

  return (
    <div className="space-y-4">
      {/* Latest Checkpoint Card */}
      {latest && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Latest Checkpoint</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                #{latest.sequenceNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Items Saved</p>
                  <p className="text-2xl font-bold">{latest.itemsScraped}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {latest.state?.progress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Progress State</p>
                  <div className="bg-muted p-3 rounded space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Search Terms</span>
                      <span className="font-medium">
                        {latest.state.progress.processedSearchTerms?.length || 0} / 
                        {latest.state.progress.totalSearchTerms}
                      </span>
                    </div>
                    {latest.state.progress.currentSearchTermIndex !== undefined && (
                      <Progress 
                        value={(latest.state.progress.currentSearchTermIndex / latest.state.progress.totalSearchTerms) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Browser State Summary */}
              {latest.state?.browser && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Browser State</p>
                  <div className="bg-muted p-3 rounded space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current URL</span>
                      <span className="font-mono text-xs truncate max-w-xs">
                        {latest.state.browser.currentUrl}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cookies</span>
                      <span>{latest.state.browser.cookies?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Local Storage Keys</span>
                      <span>{Object.keys(latest.state.browser.localStorage || {}).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkpoint History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checkpoint History</CardTitle>
        </CardHeader>
        <CardContent>
          {checkpoints.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No checkpoints created yet. Checkpoints are saved automatically during scraping.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded">
                      <Save className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Checkpoint #{checkpoint.sequenceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {checkpoint.itemsScraped} items saved
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {format(new Date(checkpoint.createdAt), 'MMM d, HH:mm:ss')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(checkpoint.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-save Status */}
      {isRunning && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Checkpoints are being saved automatically every 60 seconds or 100 items.
          </AlertDescription>
        </Alert>
      )}

      {/* Recovery Information */}
      {!isRunning && checkpoints.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Job can be resumed from any checkpoint. The latest checkpoint will be used by default.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}