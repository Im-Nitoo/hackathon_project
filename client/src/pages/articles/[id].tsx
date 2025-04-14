import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { EvidenceForm } from "@/components/verification/evidence-form";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  User,
  ThumbsUp,
  BookmarkPlus,
  Share2,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ArticleDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "disproven">("verified");

  const { data: article, isLoading, error } = useQuery({
    queryKey: [`/api/articles/${id}`],
  });

  const canVerifyArticle = user && (user.role === "publisher" || user.role === "journalist");
  const isAuthor = user && article && user.id === article.author.id;

  const handleVerify = async () => {
    if (!canVerifyArticle || !article) return;

    try {
      await apiRequest("POST", "/api/verifications", {
        articleId: article.id,
        status: verificationStatus,
        reason: `Article ${verificationStatus === "verified" ? "verified" : "disproven"} by ${user?.name}`
      });

      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}`] });
      
      toast({
        title: "Verification submitted",
        description: `You have ${verificationStatus === "verified" ? "verified" : "disproven"} this article.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An error occurred while verifying the article",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Error Loading Article</h2>
            <p>{error instanceof Error ? error.message : "Article not found or could not be loaded."}</p>
            <Button asChild className="mt-4">
              <Link href="/articles">Back to Articles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistance(new Date(article.createdAt), new Date(), { addSuffix: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <VerificationBadge status={article.status} />
            {article.isWhistleblower && (
              <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs font-medium">
                <Shield className="h-3 w-3" />
                <span>Whistleblower Report</span>
              </span>
            )}
            <span className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {timeAgo}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {article.author.avatar ? (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <div className="font-medium">{article.author.name}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {article.author.role 
                    ? article.author.role.charAt(0).toUpperCase() + article.author.role.slice(1)
                    : "Author"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://ipfs.io/ipfs/${article.ipfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary truncate inline-block max-w-[150px]"
              >
                ipfs://{article.ipfsHash}
              </a>
              <Button variant="ghost" size="sm">
                <BookmarkPlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {article.imageUrl && (
            <div className="mb-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none mb-8">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {canVerifyArticle && !isAuthor && (
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Verify this article</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    As a {user?.role}, you can verify this article's authenticity
                  </p>
                </div>
                <Button onClick={() => setVerifyDialogOpen(true)}>
                  Verify Article
                </Button>
              </div>
            </div>
          )}

          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Verification Status</h3>
              <div className={`text-xs px-2 py-1 rounded-full
                ${article.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                  article.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {article.verificationCount} {article.status === 'verified' ? 'Verifications' : 
                  article.status === 'pending' ? 'Pending' : 'Disprovals'}
              </div>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {article.status === 'verified' && (
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  This article has been verified by federation members and is considered reliable.
                </p>
              )}
              {article.status === 'pending' && (
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  This article is awaiting further verification. Please consider the information carefully.
                </p>
              )}
              {article.status === 'disproven' && (
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  This article has been marked as disproven by federation members.
                </p>
              )}
            </div>
          </div>

          <Tabs defaultValue="evidence">
            <TabsList className="mb-4">
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {article.evidence && article.evidence.length > 0 ? (
                    <div className="space-y-4">
                      {article.evidence.map((evidence: any) => (
                        <div key={evidence.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {evidence.user?.avatar ? (
                                <img
                                  src={evidence.user.avatar}
                                  alt={evidence.user.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-3 w-3 text-primary" />
                                </div>
                              )}
                              <span className="text-sm font-medium">{evidence.user?.name || "Anonymous"}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full
                              ${evidence.type === 'supporting' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                evidence.type === 'contradicting' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm">{evidence.description}</p>
                          {evidence.ipfsHash && (
                            <a
                              href={`https://ipfs.io/ipfs/${evidence.ipfsHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary mt-2 inline-block"
                            >
                              ipfs://{evidence.ipfsHash}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-neutral-500 dark:text-neutral-400">No evidence submissions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-6">
                <EvidenceForm preselectedArticleId={article.id} articles={[{ id: article.id, title: article.title }]} />
              </div>
            </TabsContent>
            
            <TabsContent value="verifications">
              <Card>
                <CardHeader>
                  <CardTitle>Federation Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {article.verifications && article.verifications.length > 0 ? (
                    <div className="space-y-4">
                      {article.verifications.map((verification: any) => (
                        <div key={verification.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <VerificationBadge status={verification.status} size="sm" />
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatDistance(new Date(verification.createdAt), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {verification.reason && (
                            <p className="text-sm">{verification.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-neutral-500 dark:text-neutral-400">No verifications yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Article</AlertDialogTitle>
            <AlertDialogDescription>
              Please select your verification decision. This action will be recorded on the blockchain and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 my-4">
            <Button
              variant={verificationStatus === "verified" ? "default" : "outline"}
              className={verificationStatus === "verified" ? "border-green-500" : ""}
              onClick={() => setVerificationStatus("verified")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify as True
            </Button>
            <Button
              variant={verificationStatus === "disproven" ? "default" : "outline"}
              className={verificationStatus === "disproven" ? "border-red-500" : ""}
              onClick={() => setVerificationStatus("disproven")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Mark as Disproven
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify}>Submit Verification</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
