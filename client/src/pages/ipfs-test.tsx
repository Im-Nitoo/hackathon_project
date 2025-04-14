import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, FileUp, Link as LinkIcon } from "lucide-react";

export default function IPFSTestPage() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    hash: string;
    url: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content) {
      toast({
        title: "Error",
        description: "Please enter some content to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      const response = await fetch("/api/test/ipfs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            title: title || "Untitled",
            content,
            timestamp: new Date().toISOString(),
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadResult({
        hash: data.hash,
        url: data.url,
      });
      
      toast({
        title: "Success",
        description: "Content uploaded to IPFS successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
      variant: "default",
    });
  };
  
  const viewOnIPFS = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">IPFS Integration Test</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Test uploading content to IPFS using Pinata's pinning service.
      </p>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Content</CardTitle>
            <CardDescription>
              Enter content to be stored permanently on IPFS
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title (Optional)</label>
                <Input
                  id="title"
                  placeholder="Enter a title for your content"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">Content</label>
                <Textarea
                  id="content"
                  placeholder="Enter the content to upload to IPFS"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUploading || !content}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload to IPFS
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>IPFS Result</CardTitle>
            <CardDescription>
              Content hash and links after successful upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadResult ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">IPFS Hash (CID)</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm flex-1 overflow-x-auto whitespace-nowrap">
                      {uploadResult.hash}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(uploadResult.hash)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Gateway URL</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm flex-1 overflow-x-auto whitespace-nowrap">
                      {uploadResult.url}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(uploadResult.url)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={() => viewOnIPFS(uploadResult.url)}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    View on IPFS Gateway
                  </Button>
                </div>
                
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">
                        Content successfully pinned to IPFS
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Upload content to see the IPFS results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}