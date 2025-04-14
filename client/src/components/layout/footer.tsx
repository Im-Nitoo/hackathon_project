import { Link } from "wouter";
import { CheckCircle, Github, Rss, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="font-bold mb-4">TruthNode</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Verification Protocol
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Federation Members
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">For Publishers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Join as Publisher
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Journalist Registration
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Publisher Guidelines
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  IPFS Integration
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Verification Hub
                </Link>
              </li>
              <li>
                <Link href="/whistleblower" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Whistleblower Protection
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Token System
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  API Access
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Developer Tools
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-primary dark:text-white">TruthNode</span>
            </Link>
            <span className="text-xs bg-secondary/10 text-secondary dark:text-neutral-200 dark:bg-secondary/20 px-2 py-0.5 rounded-full">Testnet</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex gap-4">
              <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                <MessageSquare className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                <Rss className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
            </div>
            
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} TruthNode · 
              <a href="#" className="hover:underline ml-1">Privacy</a> · 
              <a href="#" className="hover:underline ml-1">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
