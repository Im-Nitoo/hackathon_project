import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ipfs } from "@/lib/ipfs";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface Article {
  id: number;
  title: string;
}

interface EvidenceFormProps {
  articles?: Article[];
  preselectedArticleId?: number;
}

const evidenceSchema = z.object({
  articleId: z.string().min(1, "Please select an article"),
  type: z.enum(["supporting", "contradicting", "contextual"], {
    required_error: "Please select the type of evidence",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export function EvidenceForm({ articles = [], preselectedArticleId }: EvidenceFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof evidenceSchema>>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      articleId: preselectedArticleId ? String(preselectedArticleId) : "",
      type: "supporting",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: z.infer<typeof evidenceSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit evidence",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle file uploads to IPFS if there are any
      let ipfsHash = null;
      if (uploadedFiles.length > 0) {
        // In a real app, we would upload these files to IPFS
        // For this demo, we'll just generate a fake IPFS hash
        ipfsHash = await ipfs.add("Evidence files content would be here");
      }

      // Submit the evidence
      await apiRequest("POST", "/api/evidence", {
        articleId: parseInt(data.articleId),
        type: data.type,
        description: data.description,
        ipfsHash: ipfsHash,
        files: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name) : undefined
      });

      // Show success message
      toast({
        title: "Evidence submitted successfully!",
        description: "Thank you for your contribution to the verification process.",
      });

      // Reset the form
      form.reset();
      setUploadedFiles([]);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${data.articleId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${data.articleId}/evidence`] });

    } catch (error) {
      toast({
        title: "Failed to submit evidence",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="articleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Article</FormLabel>
                  <Select
                    disabled={!!preselectedArticleId || isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an article to verify" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={String(article.id)}>
                          {article.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="supporting" />
                        </FormControl>
                        <FormLabel className="font-normal">Supporting</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="contradicting" />
                        </FormControl>
                        <FormLabel className="font-normal">Contradicting</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="contextual" />
                        </FormControl>
                        <FormLabel className="font-normal">Contextual</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your evidence and how it relates to the article..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Evidence Files</FormLabel>
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-neutral-400" />
                <p className="text-sm mt-2">
                  Drag & drop files or{" "}
                  <label className="text-primary cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Supports documents, images, and videos (max 20MB)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                      <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Evidence"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
