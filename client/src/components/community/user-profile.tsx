import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Award } from "lucide-react";

export function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-6">
            <div className="text-center">
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Please log in to view your profile
              </p>
              <a 
                href="/login" 
                className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Log In
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock statistics for demonstration
  const stats = {
    submissions: 12,
    verified: 8,
    disputed: 3,
    reputation: 78
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Account</CardTitle>
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {user.truthTokens || 0} TruthTokens
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Community Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-white dark:bg-neutral-700 p-2 rounded">
              <div className="font-bold text-primary">{stats.submissions}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Submissions</div>
            </div>
            <div className="bg-white dark:bg-neutral-700 p-2 rounded">
              <div className="font-bold text-green-600 dark:text-green-400">{stats.verified}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Verified</div>
            </div>
            <div className="bg-white dark:bg-neutral-700 p-2 rounded">
              <div className="font-bold text-red-600 dark:text-red-400">{stats.disputed}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Disputed</div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Reputation Score:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{stats.reputation}/100</span>
          </div>
        </div>
        
        <a href="/dashboard" className="block text-center text-sm font-medium text-primary hover:underline">
          View your verification history
        </a>
      </CardContent>
    </Card>
  );
}
