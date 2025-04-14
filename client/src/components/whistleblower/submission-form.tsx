import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Shield, Info } from "lucide-react";

const whistleblowerSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  agreesToVerification: z.boolean().refine(val => val === true, {
    message: "You must agree to the verification process",
  }),
});

export function WhistleblowerSubmissionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof whistleblowerSchema>>({
    resolver: zodResolver(whistleblowerSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      category: "",
      agreesToVerification: false,
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

  const onSubmit = async (data: z.infer<typeof whistleblowerSchema>) => {
    setIsSubmitting(true);

    try {
      // Upload content to IPFS
      const content = `# ${data.title}\n\n${data.content}`;
      const ipfsHash = await ipfs.add(content);

      // Submit the article
      await apiRequest("POST", "/api/articles", {
        title: data.title,
        content: data.content,
        summary: data.summary,
        ipfsHash,
        category: data.category,
        isWhistleblower: true,
      });

      // Show success message
      toast({
        title: "Whistleblower submission successful!",
        description: "Your information has been securely submitted for verification.",
      });

      // Reset the form
      form.reset();
      setUploadedFiles([]);

    } catch (error) {
      toast({
        title: "Submission failed",
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
        <CardTitle>Submit Whistleblower Information</CardTitle>
        <CardDescription>
          All submissions are encrypted and your identity is protected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary/5 dark:bg-secondary/10 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-secondary bg-white dark:bg-neutral-800 p-1 rounded-full" />
            <div>
              <h4 className="font-medium text-secondary dark:text-neutral-100 mb-1">Your Security is Our Priority</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                All submissions are encrypted end-to-end. We never log IP addresses, browser fingerprints, or any metadata that could identify you. For maximum security, we recommend using the Tor Browser.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Information Category</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="government">Government Accountability</SelectItem>
                      <SelectItem value="corporate">Corporate Misconduct</SelectItem>
                      <SelectItem value="environment">Environmental Violations</SelectItem>
                      <SelectItem value="health">Public Health Issues</SelectItem>
                      <SelectItem value="rights">Human Rights Concerns</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Information Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief, descriptive title of the information"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief summary of the information (1-2 sentences)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the information in detail, including who, what, when, where, and why it's important..."
                      className="min-h-[200px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Supporting Files (Documents, Media)</FormLabel>
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
                  All files are encrypted before upload
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

            <FormField
              control={form.control}
              name="agreesToVerification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I understand this information will be verified before publication
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-secondary"
                disabled={isSubmitting}
              >
                <Info className="h-4 w-4" />
                <span>Verification process</span>
              </Button>
              
              <Button 
                type="submit" 
                className="bg-secondary hover:bg-secondary/90 text-white"
                disabled={isSubmitting}
              >
                <Shield className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Securely"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
