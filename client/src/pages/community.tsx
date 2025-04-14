import { useQuery } from "@tanstack/react-query";
import { EvidenceForm } from "@/components/verification/evidence-form";
import { UserProfile } from "@/components/community/user-profile";
import { TopVerifiers } from "@/components/community/top-verifiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusCircle,
  ArrowRight,
  Clock
} from "lucide-react";

export default function Community() {
  const { data: pendingArticles, isLoading } = useQuery({
    queryKey: ["/api/articles?status=pending&limit=5"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <section id="community" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Community Verification Hub</h2>
          <Button variant="link" className="text-primary">
            <a href="#submit-evidence" className="flex items-center">
              Submit evidence <PlusCircle className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Articles Needing Verification</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-3" />
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pendingArticles && pendingArticles.length > 0 ? (
                  <div className="space-y-5">
                    {pendingArticles.map((article: any) => (
                      <article 
                        key={article.id}
                        className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 border-l-4 border-yellow-500"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                                <Clock className="h-3 w-3" />
                                <span>Needs Verification</span>
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {new Date(article.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                            <h4 className="font-bold mb-2">{article.title}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 font-serif line-clamp-2">
                              {article.summary}
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {article.author.avatar ? (
                                  <img 
                                    src={article.author.avatar} 
                                    alt={article.author.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    {article.author.name.charAt(0)}
                                  </div>
                                )}
                                <div className="text-xs">{article.author.name}</div>
                              </div>
                              <a 
                                href={`https://ipfs.io/ipfs/${article.ipfsHash}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary truncate inline-block max-w-[150px]"
                              >
                                ipfs://{article.ipfsHash}
                              </a>
                            </div>
                          </div>
                          <div>
                            <Button asChild size="sm">
                              <a href={`/articles/${article.id}`}>Verify</a>
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 dark:text-neutral-400">No pending articles at the moment.</p>
                  </div>
                )}
                
                <a href="/articles?filter=pending" className="text-primary text-sm font-medium flex items-center justify-center mt-4 hover:underline">
                  View all pending articles <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
            
            <div id="submit-evidence" className="mt-6">
              <EvidenceForm articles={pendingArticles || []} />
            </div>
          </div>
          
          <div className="space-y-6">
            <UserProfile />
            <TopVerifiers />
          </div>
        </div>
      </section>
    </div>
  );
}
