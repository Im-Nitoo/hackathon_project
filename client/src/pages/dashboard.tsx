import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleList } from "@/components/articles/article-list";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ipfs } from "@/lib/ipfs";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  User,
  Edit,
  FileText,
  Shield,
  CheckCircle,
  Award,
  Upload,
  Loader2
} from "lucide-react";
import { useState } from "react";

const articleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  imageUrl: z.string().optional(),
  isWhistleblower: z.boolean().default(false),
});

const publisherApplicationSchema = z.object({
  organization: z.string().min(2, "Organization name is required"),
  website: z.string().url("Please enter a valid website URL"),
  reason: z.string().min(20, "Please provide more details about your application"),
});

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: userArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ["/api/articles?authorId=" + (user?.id || 0)],
    enabled: !!user,
  });

  const articleForm = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      category: "",
      imageUrl: "",
      isWhistleblower: false,
    },
  });

  const publisherForm = useForm<z.infer<typeof publisherApplicationSchema>>({
    resolver: zodResolver(publisherApplicationSchema),
    defaultValues: {
      organization: "",
      website: "",
      reason: "",
    },
  });

  const onSubmitArticle = async (data: z.infer<typeof articleSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload content to IPFS
      const fullContent = `# ${data.title}\n\n${data.content}`;
      const ipfsHash = await ipfs.add(fullContent);
      
      // Create article
      await apiRequest("POST", "/api/articles", {
        ...data,
        ipfsHash,
      });
      
      toast({
        title: "Article published successfully!",
        description: "Your article has been submitted for verification.",
      });
      
      // Reset form
      articleForm.reset();
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      
    } catch (error) {
      toast({
        title: "Error publishing article",
        description: error instanceof Error ? error.message : "Failed to publish article",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitPublisherApplication = async (data: z.infer<typeof publisherApplicationSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit publisher application
      await apiRequest("POST", "/api/publisher-applications", data);
      
      toast({
        title: "Application submitted successfully!",
        description: "Your publisher application is now being reviewed.",
      });
      
      // Reset form
      publisherForm.reset();
      
    } catch (error) {
      toast({
        title: "Error submitting application",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="mb-6 text-neutral-500 dark:text-neutral-400">
              Please log in to access your dashboard.
            </p>
            <Button asChild>
              <a href="/login">Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Welcome back, {user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.truthTokens || 0}</div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Truth Tokens</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{articlesLoading ? "..." : userArticles?.length || 0}</div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Articles Published</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {user.reputation ? `${user.reputation}/100` : "N/A"}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Reputation Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="mb-6">
          <TabsTrigger value="content">My Content</TabsTrigger>
          <TabsTrigger value="publish">Publish Article</TabsTrigger>
          {user.role === "community" && (
            <TabsTrigger value="apply">Apply as Publisher</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>My Articles</CardTitle>
                <CardDescription>Articles you have published</CardDescription>
              </CardHeader>
              <CardContent>
                {articlesLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                      </div>
                    ))}
                  </div>
                ) : userArticles && userArticles.length > 0 ? (
                  <div className="space-y-6">
                    {userArticles.map((article: any) => (
                      <div key={article.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                        <h3 className="font-bold text-lg mb-1">
                          <a href={`/articles/${article.id}`} className="hover:text-primary transition-colors">
                            {article.title}
                          </a>
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full
                            ${article.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              article.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                          </span>
                          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded-full">
                            {article.category}
                          </span>
                          {article.isWhistleblower && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                              Whistleblower
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          <a 
                            href={`https://ipfs.io/ipfs/${article.ipfsHash}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            ipfs://{article.ipfsHash}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      You haven't published any articles yet.
                    </p>
                    <Button className="mx-auto" onClick={() => document.querySelector('[data-value="publish"]')?.click()}>
                      Create Your First Article
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="publish">
          {user.role === "publisher" || user.role === "journalist" ? (
            <Card>
              <CardHeader>
                <CardTitle>Publish a New Article</CardTitle>
                <CardDescription>
                  Create content that will be stored on IPFS and verified by the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...articleForm}>
                  <form onSubmit={articleForm.handleSubmit(onSubmitArticle)} className="space-y-6">
                    <FormField
                      control={articleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a descriptive title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a brief summary (1-2 sentences)" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your article content..." 
                              className="min-h-[200px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={articleForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="climate">Climate</SelectItem>
                                <SelectItem value="politics">Politics</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="economy">Economy</SelectItem>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="science">Science</SelectItem>
                                <SelectItem value="environment">Environment</SelectItem>
                                <SelectItem value="culture">Culture</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={articleForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Featured Image URL (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={articleForm.control}
                      name="isWhistleblower"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Submit as whistleblower report
                            </FormLabel>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              This will mark your article as sensitive information that requires special verification
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Publish to IPFS
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Publisher or Journalist Role Required</h2>
                <p className="mb-6 text-neutral-500 dark:text-neutral-400">
                  You need to be a verified publisher or journalist to publish articles.
                  Apply for verification to gain publishing permissions.
                </p>
                <Button onClick={() => document.querySelector('[data-value="apply"]')?.click()}>
                  Apply as Publisher
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apply">
          <Card>
            <CardHeader>
              <CardTitle>Apply to Become a Publisher</CardTitle>
              <CardDescription>
                Publishers can create content, verify articles, and participate in the federation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...publisherForm}>
                <form onSubmit={publisherForm.handleSubmit(onSubmitPublisherApplication)} className="space-y-6">
                  <FormField
                    control={publisherForm.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of your publication or organization" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={publisherForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={publisherForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to join the federation?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your organization and why you want to join..." 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit Application
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
