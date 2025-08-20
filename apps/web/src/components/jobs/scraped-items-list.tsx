'use client';

import { useState } from 'react';
import { useGetScrapedItemsQuery } from '@/graphql/generated/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ExternalLink, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface ScrapedItemsListProps {
  jobId: string;
}

export function ScrapedItemsList({ jobId }: ScrapedItemsListProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const pageSize = 20;

  const { data, loading, error } = useGetScrapedItemsQuery({
    variables: {
      input: {
        jobId,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
    },
    pollInterval: 5000, // Refresh every 5 seconds
  });

  if (loading && !data) return <ScrapedItemsListSkeleton />;
  if (error) return <div>Error loading items: {error.message}</div>;

  const items = data?.getScrapedItems || [];
  const totalCount = items.length; // We'll need to get this from a separate query
  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredItems = searchTerm
    ? items.filter(item => {
        const normalizedData = item.normalizedData as any;
        const title = normalizedData?.name || normalizedData?.productName || 'Untitled';
        const category = normalizedData?.category || '';
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : items;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Scraped Items</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Scraped At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const normalizedData = item.normalizedData as any;
              const title = normalizedData?.name || normalizedData?.productName || 'Untitled';
              const category = normalizedData?.category || 'Unknown';
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.provider}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.scrapedAt), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.sourceUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a href={item.sourceUrl} target="_blank" rel="noopener">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No items match your search.' : 'No items scraped yet.'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, totalCount)} of {totalCount} items
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.normalizedData?.name || selectedItem?.normalizedData?.productName || 'Item Details'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Normalized Data</h4>
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedItem?.normalizedData, null, 2)}
                  </pre>
                </div>
                {selectedItem?.sourceUrl && (
                  <div>
                    <h4 className="font-semibold mb-2">Source</h4>
                    <a
                      href={selectedItem.sourceUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedItem.sourceUrl}
                    </a>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Metadata</h4>
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedItem?.metadata, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Raw HTML Preview</h4>
                  <div className="bg-muted p-4 rounded text-sm max-h-40 overflow-auto">
                    {selectedItem?.rawHtml?.substring(0, 500)}...
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ScrapedItemsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}