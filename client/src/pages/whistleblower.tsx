import { WhistleblowerSubmissionForm } from "@/components/whistleblower/submission-form";
import { useQuery } from "@tanstack/react-query";
import { ArticleList } from "@/components/articles/article-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";

export default function Whistleblower() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Whistleblower Hub</h2>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 font-medium">End-to-end encrypted</span>
            </span>
            <Button variant="link" className="text-primary" asChild>
              <a href="#learn-more">
                Learn more <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
        
        <div className="bg-secondary/5 dark:bg-secondary/20 rounded-xl p-6 mb-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-full inline-block mb-4">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-secondary dark:text-white mb-3">Securely Share Sensitive Information</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
              Our whistleblower hub allows journalists and sources to anonymously publish sensitive information 
              while maintaining the highest standards of verification and security.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-secondary hover:bg-secondary/90 text-white flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <a href="#submit-form">Submit Information</a>
              </Button>
              <Button variant="outline" className="border-secondary/20 text-secondary dark:text-white hover:bg-secondary/5">
                <a href="#for-journalists">For Journalists</a>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recently Verified Whistleblower Reports</h3>
          </div>
          
          <ArticleList status="verified" isWhistleblower={true} limit={2} />
        </div>
        
        <div id="submit-form" className="mb-12">
          <WhistleblowerSubmissionForm />
        </div>
        
        <div id="learn-more" className="mb-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">How Our Whistleblower System Works</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary/5 dark:bg-secondary/10 p-4 rounded-xl">
                  <Shield className="h-6 w-6 text-secondary mb-2" />
                  <h4 className="font-bold mb-2">End-to-End Encryption</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    All submissions are encrypted from your browser directly to our secure storage. 
                    Even we cannot access unencrypted content.
                  </p>
                </div>
                
                <div className="bg-secondary/5 dark:bg-secondary/10 p-4 rounded-xl">
                  <Shield className="h-6 w-6 text-secondary mb-2" />
                  <h4 className="font-bold mb-2">No Identifying Metadata</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    We scrub all metadata including IP addresses, browser fingerprints, and timestamp information 
                    that could identify you.
                  </p>
                </div>
                
                <div className="bg-secondary/5 dark:bg-secondary/10 p-4 rounded-xl">
                  <Shield className="h-6 w-6 text-secondary mb-2" />
                  <h4 className="font-bold mb-2">Verified Publication</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your information is carefully verified by our federation before publication, 
                    ensuring credibility while maintaining your anonymity.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-lg">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">For Maximum Security</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  For the highest level of protection, we recommend using the Tor Browser to access this page, 
                  and avoid including any personally identifying information in your submissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div id="for-journalists" className="mb-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">For Journalists</h3>
              
              <p className="mb-4 text-neutral-600 dark:text-neutral-300">
                As a verified journalist on TruthNode, you can help verify and publish whistleblower information 
                while maintaining source protection.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border border-neutral-200 dark:border-neutral-700 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Source Protection</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Our platform enables you to work with whistleblowers without ever knowing their identity, 
                    providing true plausible deniability and protection.
                  </p>
                </div>
                
                <div className="border border-neutral-200 dark:border-neutral-700 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Federation Verification</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Collaborate with other journalists to verify submissions, ensuring the information
                    is accurate before publication.
                  </p>
                </div>
              </div>
              
              <Button className="w-full md:w-auto">
                <a href="/register">Register as a Journalist</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
