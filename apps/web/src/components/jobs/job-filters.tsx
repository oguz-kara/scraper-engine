'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobFilterInput, JobStatus, ScrapingProvider } from '@/graphql/generated/sdk';

interface JobFiltersProps {
  filter: JobFilterInput;
  onFilterChange: (filter: JobFilterInput) => void;
}

export function JobFilters({ filter, onFilterChange }: JobFiltersProps) {
  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      const { status, ...rest } = filter;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...filter, status: value as JobStatus });
    }
  };

  const handleProviderChange = (value: string) => {
    if (value === 'all') {
      const { provider, ...rest } = filter;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...filter, provider: value as ScrapingProvider });
    }
  };

  return (
    <div className="flex gap-4 flex-wrap">
      <Select
        value={filter.status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value={JobStatus.Pending}>Pending</SelectItem>
          <SelectItem value={JobStatus.Running}>Running</SelectItem>
          <SelectItem value={JobStatus.Paused}>Paused</SelectItem>
          <SelectItem value={JobStatus.Completed}>Completed</SelectItem>
          <SelectItem value={JobStatus.Failed}>Failed</SelectItem>
          <SelectItem value={JobStatus.Cancelled}>Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filter.provider || 'all'}
        onValueChange={handleProviderChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Providers</SelectItem>
          <SelectItem value={ScrapingProvider.Shell}>Shell</SelectItem>
          <SelectItem value={ScrapingProvider.Castrol}>Castrol</SelectItem>
          <SelectItem value={ScrapingProvider.Google}>Google</SelectItem>
          <SelectItem value={ScrapingProvider.Linkedin}>LinkedIn</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}