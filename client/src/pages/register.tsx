import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { blockchain } from "@/lib/blockchain";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Loader2
} from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["publisher", "journalist", "community"]),
  bio: z.string().optional(),
  ensAddress: z.string().optional(),
});

export default function Register() {
  const { register, isLoading } = useAuth();
  const [verifyingENS, setVerifyingENS] = useState(false);
  const [ensVerified, setEnsVerified] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
      role: "community",
      bio: "",
      ensAddress: "",
    },
  });

  const selectedRole = form.watch("role");
  const ensAddress = form.watch("ensAddress");

  const handleVerifyENS = async () => {
    if (!ensAddress || ensAddress.trim() === "") return;
    
    setVerifyingENS(true);
    try {
      // In a real app, this would interact with the Ethereum blockchain
      // Here we're using a simulated response
      const validENS = await blockchain.verifyENS(blockchain.generateAddress(), ensAddress);
      setEnsVerified(validENS);
      
      if (!validENS) {
        form.setError("ensAddress", { 
          type: "manual", 
          message: "ENS address could not be verified. Please make sure it's correct." 
        });
      } else {
        form.clearErrors("ensAddress");
      }
    } catch (error) {
      form.setError("ensAddress", { 
        type: "manual", 
        message: "Error verifying ENS address. Please try again." 
      });
      setEnsVerified(false);
    } finally {
      setVerifyingENS(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if ((selectedRole === "publisher" || selectedRole === "journalist") && !ensVerified) {
      form.setError("ensAddress", { 
        type: "manual", 
        message: "ENS verification is required for publishers and journalists." 
      });
      return;
    }
    
    await register(data);
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join TruthNode and be part of the decentralized news revolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="community" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Community Member (Verify content and submit evidence)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="journalist" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Journalist (Publish and verify content)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="publisher" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Publisher (Represent a news organization)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(selectedRole === "publisher" || selectedRole === "journalist") && (
                  <>
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Bio {selectedRole === "publisher" ? "(Organization Description)" : ""}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                selectedRole === "publisher"
                                  ? "Describe your news organization"
                                  : "Tell us about your journalism background"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ensAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ENS Address (for blockchain verification)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="yourname.eth" 
                                {...field} 
                                className={ensVerified ? "border-green-500" : ""}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleVerifyENS}
                              disabled={verifyingENS || !field.value || field.value.trim() === ""}
                            >
                              {verifyingENS ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : ensVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                          {ensVerified && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> ENS address verified successfully
                            </p>
                          )}
                          <FormDescription>
                            Publishers and journalists must verify their identity with an ENS address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
