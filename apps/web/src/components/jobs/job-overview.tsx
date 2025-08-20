'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Settings, 
  Database,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface JobOverviewProps {
  job: {
    id: string;
    provider: string;
    status: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    // updatedAt removed; backend exposes createdAt/startedAt/completedAt/pausedAt/failedAt
    input: any;
    progressPercentage: number;
    itemsScraped: number;
    remainingInput?: any;
    currentInput?: any;
  };
}

export function JobOverview({ job }: JobOverviewProps) {
  const duration = job.startedAt && job.completedAt 
    ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
    : job.startedAt 
    ? Date.now() - new Date(job.startedAt).getTime()
    : null;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Provider:</span>
                <Badge variant="outline">{job.provider}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Progress:</span>
                <span className="font-medium">{job.progressPercentage}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Items Scraped:</span>
                <span className="font-medium">{job.itemsScraped}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">
                  {format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              
              {job.startedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Started:</span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
                  </span>
                </div>
              )}
              
              {duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm font-medium">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Job Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Input Parameters</h4>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(job.input, null, 2)}
              </pre>
            </div>
            
            {job.currentInput && (
              <div>
                <h4 className="font-semibold mb-2">Current Processing</h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(job.currentInput, null, 2)}
                </pre>
              </div>
            )}
            
            {job.remainingInput && Object.keys(job.remainingInput).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Remaining Input</h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(job.remainingInput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <Badge variant={
                job.status === 'COMPLETED' ? 'default' : 
                job.status === 'RUNNING' ? 'secondary' : 
                job.status === 'FAILED' ? 'destructive' : 
                'outline'
              }>
                {job.status}
              </Badge>
            </div>
            
            {/* No updatedAt field on backend; omit "Last Updated" */}
            
            {job.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed:</span>
                <span className="text-sm">
                  {format(new Date(job.completedAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}