import { Link } from "wouter";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";
import { formatDistance } from "date-fns";

interface Author {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
}

interface ArticleCardProps {
  id: number;
  title: string;
  summary: string;
  ipfsHash: string;
  imageUrl?: string;
  status: "pending" | "verified" | "disproven";
  verificationCount: number;
  createdAt: string;
  author: Author;
}

export function ArticleCard({
  id,
  title,
  summary,
  ipfsHash,
  imageUrl,
  status,
  verificationCount,
  createdAt,
  author,
}: ArticleCardProps) {
  const timeAgo = formatDistance(new Date(createdAt), new Date(), { addSuffix: true });
  
  return (
    <article 
      data-verification={status} 
      className={`bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col
        ${status === 'verified' ? 'border-l-4 border-green-500' : 
          status === 'pending' ? 'border-l-4 border-yellow-500' : 
          'border-l-4 border-red-500'}`}
    >
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <VerificationBadge status={status} />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo}</span>
        </div>
        <Link href={`/articles/${id}`}>
          <h3 className="text-lg font-bold mb-2 hover:text-primary transition-colors">{title}</h3>
        </Link>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 font-serif line-clamp-3">{summary}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {author.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-sm font-medium">{author.name}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {author.role ? author.role.charAt(0).toUpperCase() + author.role.slice(1) : 'Author'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-400">0</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
          <a 
            href={`https://ipfs.io/ipfs/${ipfsHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary truncate inline-block max-w-[200px]"
          >
            ipfs://{ipfsHash}
          </a>
          <div className={`text-xs px-2 py-1 rounded-full
            ${status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
              status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {status === 'verified' ? `${verificationCount} Verifications` : 
             status === 'pending' ? `${verificationCount || 0} Verifications in progress` : 
             `${verificationCount || 0} Disprovals`}
          </div>
        </div>
      </CardContent>
    </article>
  );
}
