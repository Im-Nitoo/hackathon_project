import { useState } from "react";
import { ArticleList } from "@/components/articles/article-list";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Articles() {
  const [sortBy, setSortBy] = useState("latest");
  const [filter, setFilter] = useState("all");
  
  const getStatusFilter = () => {
    switch (filter) {
      case "verified":
        return "verified";
      case "pending":
        return "pending";
      case "disproven":
        return "disproven";
      default:
        return undefined;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Articles</h2>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Articles</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disproven">Disproven</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="most_verified">Most Verified</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ArticleList status={getStatusFilter()} />
      </section>
    </div>
  );
}
