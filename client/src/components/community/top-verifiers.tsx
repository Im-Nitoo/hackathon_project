import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

interface Verifier {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  truthTokens: number;
}

export function TopVerifiers() {
  const { data: verifiers, isLoading, error } = useQuery({
    queryKey: ["/api/top-verifiers"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Community Verifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Community Verifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            Error loading top verifiers
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Community Verifiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {verifiers && verifiers.map((verifier: Verifier, index: number) => (
            <div key={verifier.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">#{index + 1}</span>
                {verifier.avatar ? (
                  <img
                    src={verifier.avatar}
                    alt={verifier.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">{verifier.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {verifier.truthTokens} verifications
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {verifier.truthTokens}
              </span>
            </div>
          ))}
        </div>
        
        <a href="/community" className="block text-center text-sm font-medium text-primary mt-4 hover:underline">
          View full leaderboard
        </a>
      </CardContent>
    </Card>
  );
}
