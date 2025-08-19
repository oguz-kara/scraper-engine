import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Ban 
} from 'lucide-react';
import { JobStatus } from '@/graphql/generated/sdk';

interface StatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
  icon: React.ElementType;
  className: string;
}

const statusConfig: Record<JobStatus, StatusConfig> = {
  PENDING: { 
    variant: 'secondary', 
    label: 'Pending', 
    icon: Clock,
    className: 'bg-gray-100 text-gray-800'
  },
  RUNNING: { 
    variant: 'default', 
    label: 'Running', 
    icon: Play,
    className: 'bg-blue-100 text-blue-800'
  },
  PAUSED: { 
    variant: 'outline', 
    label: 'Paused', 
    icon: Pause,
    className: 'bg-yellow-100 text-yellow-800'
  },
  COMPLETED: { 
    variant: 'default', 
    label: 'Completed', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800'
  },
  FAILED: { 
    variant: 'destructive', 
    label: 'Failed', 
    icon: XCircle,
    className: 'bg-red-100 text-red-800'
  },
  CANCELLED: { 
    variant: 'secondary', 
    label: 'Cancelled', 
    icon: Ban,
    className: 'bg-gray-100 text-gray-800'
  },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}