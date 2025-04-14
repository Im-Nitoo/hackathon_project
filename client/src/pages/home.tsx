import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleList } from "@/components/articles/article-list";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Database, 
  Wallet, 
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-primary/5 dark:bg-primary/20 p-6 rounded-2xl mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">
              Decentralized Truth in Journalism
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
              News verified by a federation of publishers, stored on IPFS, powered by blockchain
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Federation Verified</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full">
                <Database className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">IPFS Stored</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full">
                <Wallet className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">ENS Authenticated</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/articles">Start Reading</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/register">Become a Publisher</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Platform Statistics</h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats?.publisherCount}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Verified Publishers</div>
                  </div>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats?.articleCount}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Articles on IPFS</div>
                  </div>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats?.verificationRate}%</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Verification Rate</div>
                  </div>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats?.tokenCount}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">TruthTokens Distributed</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Featured Articles Section */}
      <section id="featured" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Stories</h2>
          <Link href="/articles" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <ArticleList showFeatured={true} limit={3} />
      </section>
      
      {/* Publisher Join Section */}
      <section className="mb-12">
        <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-primary dark:text-white mb-4">Join the Federation of Truth</h2>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
              For publishers and journalists committed to verified, decentralized news. Become part of the network that's redefining trust in journalism.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl text-center">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full inline-block mb-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Verify & Publish</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Participate in the verification process and publish with the trust of the federation.
                </p>
              </div>
              
              <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl text-center">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full inline-block mb-3">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Earn TruthTokens</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Receive tokens for verified content and participation in the truth verification process.
                </p>
              </div>
              
              <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl text-center">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full inline-block mb-3">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Decentralized Storage</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Your content lives on IPFS, permanently accessible and resistant to censorship.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                <Link href="/register">Apply as Publisher</Link>
              </Button>
              <Button variant="outline" className="border-primary/20" asChild>
                <Link href="/register">Register as Journalist</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
