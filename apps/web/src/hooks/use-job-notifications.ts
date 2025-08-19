import { useEffect } from 'react';
import { useJobStatusChangedSubscription } from '@/graphql/generated/hooks';
import { useToast } from '@/hooks/use-toast';
import { JobStatus } from '@/graphql/generated/sdk';

export function useJobNotifications() {
  const { toast } = useToast();
  const { data } = useJobStatusChangedSubscription({
    onError: (error) => {
      console.warn('Notification subscription error:', error.message);
    },
  });

  useEffect(() => {
    if (data?.jobStatusChanged) {
      const job = data.jobStatusChanged;
      
      switch (job.status) {
        case JobStatus.Running:
          toast({
            title: '🚀 Job Started',
            description: `Job ${job.id.slice(-8)} is now running`,
          });
          break;
        case JobStatus.Completed:
          toast({
            title: '✅ Job Completed',
            description: `Job ${job.id.slice(-8)} completed successfully`,
            variant: 'default',
          });
          break;
        case JobStatus.Failed:
          toast({
            title: '❌ Job Failed',
            description: `Job ${job.id.slice(-8)} failed to complete`,
            variant: 'destructive',
          });
          break;
        case JobStatus.Paused:
          toast({
            title: '⏸️ Job Paused',
            description: `Job ${job.id.slice(-8)} has been paused`,
          });
          break;
        case JobStatus.Cancelled:
          toast({
            title: '🛑 Job Cancelled',
            description: `Job ${job.id.slice(-8)} was cancelled`,
          });
          break;
      }
    }
  }, [data, toast]);
}