'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateJobMutation } from '@/graphql/generated/hooks'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ScrapingProvider } from '@/graphql/generated/sdk'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

const createJobSchema = z.object({
  provider: z.nativeEnum(ScrapingProvider),
  hasInput: z.boolean().default(false),
  searchTerms: z.string().optional(),
  urls: z.string().optional(),
  filters: z.string().optional(),
})

type CreateJobFormData = z.infer<typeof createJobSchema>

export function CreateJobForm() {
  const router = useRouter()
  const { toast } = useToast()

  // ALWAYS use generated mutation hook
  const [createJob, { loading }] = useCreateJobMutation({
    onCompleted: data => {
      toast({
        title: 'Job Created',
        description: `Job ${data.createJob.id.slice(-8)} has been created successfully.`,
      })
      router.push(`/jobs/${data.createJob.id}`)
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      provider: ScrapingProvider.Shell,
      hasInput: false,
      searchTerms: '',
      urls: '',
      filters: '',
    },
  })

  const hasInput = form.watch('hasInput')

  const onSubmit = async (values: CreateJobFormData) => {
    let input: { searchTerms?: string[]; urls?: string[]; filters?: any } | undefined

    if (values.hasInput) {
      input = {}

      if (values.searchTerms) {
        input.searchTerms = values.searchTerms.split('\n').filter(term => term.trim())
      }

      if (values.urls) {
        input.urls = values.urls.split('\n').filter(url => url.trim())
      }

      if (values.filters) {
        try {
          input.filters = JSON.parse(values.filters)
        } catch (error) {
          toast({
            title: 'Invalid JSON',
            description: 'The filters field must be valid JSON.',
            variant: 'destructive',
          })
          return
        }
      }
    }

    await createJob({
      variables: {
        input: {
          provider: values.provider,
          input: input,
        },
      },
    })
  }

  const providerDescriptions: Record<ScrapingProvider, string> = {
    [ScrapingProvider.Shell]: 'Scrape Shell gas station locations and pricing data',
    [ScrapingProvider.Castrol]: 'Scrape Castrol service locations and product information',
    [ScrapingProvider.Google]: 'Perform Google searches and scrape search results',
    [ScrapingProvider.Linkedin]: 'Scrape LinkedIn profiles and company data',
    [ScrapingProvider.Test]: 'Test scraping strategy',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Scraping Job</CardTitle>
          <CardDescription>Configure a new scraping job to collect data from your chosen provider.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {Object.values(ScrapingProvider).map(provider => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{providerDescriptions[field.value]}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasInput"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Provide structured input</FormLabel>
                      <FormDescription>
                        Enable this to provide specific search terms, URLs, or filters for the job.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasInput && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">Job Input Configuration</h4>

                  <FormField
                    control={form.control}
                    name="searchTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter search terms, one per line&#10;gas station near me&#10;fuel prices"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter search terms, one per line. These will be used to guide the scraping process.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URLs</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter URLs, one per line&#10;https://example.com/page1&#10;https://example.com/page2"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Enter specific URLs to scrape, one per line.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filters (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"location": "New York", "category": "premium"}'
                            className="min-h-[100px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional filters in JSON format to customize the scraping behavior.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.push('/jobs')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Job
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
