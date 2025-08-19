import Link from 'next/link'
import { JobList } from '@/components/jobs/job-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage and monitor your scraping jobs</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>

      <JobList />
    </div>
  )
}
