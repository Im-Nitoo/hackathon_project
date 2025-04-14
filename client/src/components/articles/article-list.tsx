import { ArticleCard } from "@/components/articles/article-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleListProps {
  status?: "pending" | "verified" | "disproven";
  limit?: number;
  showFeatured?: boolean;
  isWhistleblower?: boolean;
}

export function ArticleList({ 
  status, 
  limit = 10,
  showFeatured = false,
  isWhistleblower = false
}: ArticleListProps) {
  const endpoint = showFeatured 
    ? `/api/articles/featured?limit=${limit}` 
    : `/api/articles?limit=${limit}${status ? `&status=${status}` : ''}${isWhistleblower ? '&whistleblower=true' : ''}`;
  
  const { data: articles, isLoading, error } = useQuery({
    queryKey: [endpoint],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(limit).fill(0).map((_, index) => (
          <div key={index} className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <Skeleton className="w-full h-48" />
            <div className="p-5">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md">
        Error loading articles: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-xl text-center">
        <p className="text-neutral-600 dark:text-neutral-400">No articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article: any) => (
        <ArticleCard
          key={article.id}
          id={article.id}
          title={article.title}
          summary={article.summary}
          ipfsHash={article.ipfsHash}
          imageUrl={article.imageUrl}
          status={article.status}
          verificationCount={article.verificationCount}
          createdAt={article.createdAt}
          author={article.author}
        />
      ))}
    </div>
  );
}
