import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as crypto from "crypto";
import { ipfs } from "./ipfs";
import { 
  insertUserSchema, 
  insertArticleSchema, 
  insertEvidenceSchema, 
  insertVerificationSchema,
  insertPublisherApplicationSchema,
  User
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

// Mock blockchain client for server-side
const blockchain = {
  resolveENS: async (ensName: string) => {
    // Return a fake Ethereum address for testing
    return `0x${crypto.randomBytes(20).toString('hex')}`;
  },
  verifySignature: async (message: string, signature: string, expectedAddress?: string) => {
    return { isValid: true, recoveredAddress: expectedAddress || `0x${crypto.randomBytes(20).toString('hex')}` };
  },
  awardTokens: async (address: string, amount: number, reason: string = 'contribution') => {
    console.log(`[Blockchain Mock] Awarded ${amount} tokens to ${address} for ${reason}`);
    return true;
  },
  getTransactionHistory: () => {
    return [
      { 
        hash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: Date.now(),
        from: `0x${crypto.randomBytes(20).toString('hex')}`,
        to: `0x${crypto.randomBytes(20).toString('hex')}`,
        value: Math.floor(Math.random() * 10) + 1,
        status: 'confirmed'
      }
    ];
  },
  generateAddress: () => {
    return `0x${crypto.randomBytes(20).toString('hex')}`;
  }
};

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

// JWT Secret for token signing
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Simple session store
const sessions: Record<string, any> = {};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: Request, res: Response, next: Function) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const session = sessions[token];
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    req.user = session.user;
    next();
  };
  
  // User routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Generate token
      const token = crypto.randomBytes(64).toString('hex');
      sessions[token] = { user };
      
      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          truthTokens: user.truthTokens
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = crypto.randomBytes(64).toString('hex');
      sessions[token] = { user };
      
      res.json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          truthTokens: user.truthTokens
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login error" });
    }
  });
  
  app.get('/api/users/me', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        ensAddress: user.ensAddress,
        reputation: user.reputation,
        truthTokens: user.truthTokens
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user data" });
    }
  });
  
  app.get('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        truthTokens: user.truthTokens
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Articles routes
  app.get('/api/articles', async (req, res) => {
    try {
      const { limit, offset, status, whistleblower } = req.query;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (status) options.status = status as string;
      if (whistleblower) options.isWhistleblower = whistleblower === 'true';
      
      const articles = await storage.getArticles(options);
      
      // Get author info for each article
      const articlesWithAuthors = await Promise.all(
        articles.map(async (article) => {
          const author = await storage.getUser(article.authorId);
          return {
            ...article,
            author: author ? {
              id: author.id,
              name: author.name,
              username: author.username,
              avatar: author.avatar,
              role: author.role
            } : null
          };
        })
      );
      
      res.json(articlesWithAuthors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articles" });
    }
  });
  
  app.get('/api/articles/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const featuredArticles = await storage.getFeaturedArticles(limit);
      
      // Get author info for each article
      const articlesWithAuthors = await Promise.all(
        featuredArticles.map(async (article) => {
          const author = await storage.getUser(article.authorId);
          return {
            ...article,
            author: author ? {
              id: author.id,
              name: author.name,
              username: author.username,
              avatar: author.avatar,
              role: author.role
            } : null
          };
        })
      );
      
      res.json(articlesWithAuthors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured articles" });
    }
  });
  
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Get article author
      const author = await storage.getUser(article.authorId);
      
      // Get verifications
      const verifications = await storage.getVerificationsForArticle(id);
      
      // Get evidence
      const evidence = await storage.getEvidenceForArticle(id);
      
      res.json({
        ...article,
        author: author ? {
          id: author.id,
          name: author.name,
          username: author.username,
          avatar: author.avatar,
          role: author.role
        } : null,
        verifications,
        evidence
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching article" });
    }
  });
  
  app.post('/api/articles', authenticateUser, async (req, res) => {
    try {
      // Only publishers and journalists can create articles
      if (req.user.role !== 'publisher' && req.user.role !== 'journalist') {
        return res.status(403).json({ message: "Only publishers and journalists can create articles" });
      }
      
      const articleData = insertArticleSchema.parse({
        ...req.body,
        authorId: req.user.id
      });
      
      const article = await storage.createArticle(articleData);
      
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating article" });
    }
  });
  
  // Evidence routes
  app.post('/api/evidence', authenticateUser, async (req, res) => {
    try {
      const evidenceData = insertEvidenceSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const article = await storage.getArticle(evidenceData.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const evidence = await storage.createEvidence(evidenceData);
      
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error submitting evidence" });
    }
  });
  
  app.get('/api/articles/:id/evidence', async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const evidence = await storage.getEvidenceForArticle(articleId);
      
      // Get user info for each evidence
      const evidenceWithUsers = await Promise.all(
        evidence.map(async (item) => {
          const user = await storage.getUser(item.userId);
          return {
            ...item,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.avatar
            } : null
          };
        })
      );
      
      res.json(evidenceWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching evidence" });
    }
  });
  
  // Verification routes
  app.post('/api/verifications', authenticateUser, async (req, res) => {
    try {
      // Only publishers and journalists can create verifications
      if (req.user.role !== 'publisher' && req.user.role !== 'journalist') {
        return res.status(403).json({ message: "Only publishers and journalists can verify articles" });
      }
      
      const verificationData = insertVerificationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const article = await storage.getArticle(verificationData.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const verification = await storage.createVerification(verificationData);
      
      res.status(201).json(verification);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating verification" });
    }
  });
  
  // Publisher application routes
  app.post('/api/publisher-applications', authenticateUser, async (req, res) => {
    try {
      // Only community users can apply to become publishers
      if (req.user.role !== 'community') {
        return res.status(403).json({ message: "Only community users can apply to become publishers" });
      }
      
      const applicationData = insertPublisherApplicationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const application = await storage.createPublisherApplication(applicationData);
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error submitting application" });
    }
  });
  
  // For administrative purposes in a real app - would have auth checks
  app.patch('/api/publisher-applications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      const { status } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedApplication = await storage.updatePublisherApplicationStatus(id, status);
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Error updating application" });
    }
  });
  
  // Stats routes
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });
  
  // Test IPFS integration
  app.post('/api/test/ipfs', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Store content on IPFS
      const hash = await ipfs.add(JSON.stringify({
        content,
        timestamp: new Date().toISOString()
      }), {
        name: 'IPFS Test',
        description: 'Test content for IPFS integration'
      });
      
      res.json({
        success: true,
        hash,
        url: ipfs.getUrl(hash)
      });
    } catch (error) {
      console.error('IPFS test error:', error);
      res.status(500).json({ 
        message: "Error testing IPFS integration", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Top verifiers
  app.get('/api/top-verifiers', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const topVerifiers = await storage.getTopVerifiers(limit);
      
      // Only return necessary user info
      const verifiers = topVerifiers.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        truthTokens: user.truthTokens
      }));
      
      res.json(verifiers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching top verifiers" });
    }
  });
  
  // ENS Authentication and verification
  app.post('/api/ens/verify', authenticateUser, async (req, res) => {
    try {
      const { ensName, signature, message } = req.body;
      
      if (!ensName || !signature || !message) {
        return res.status(400).json({ message: "ENS name, signature, and message are required" });
      }
      
      // Verify the ENS name
      const resolvedAddress = await blockchain.resolveENS(ensName);
      if (!resolvedAddress) {
        return res.status(400).json({ message: "Could not resolve ENS name" });
      }
      
      // Verify the signature
      const signatureResult = await blockchain.verifySignature(message, signature, resolvedAddress);
      if (!signatureResult.isValid) {
        return res.status(400).json({ message: "Signature verification failed" });
      }
      
      // If verification passed, update the user's ENS address and store the signature
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Store signature for future reference
      await storage.storeSignature(user.id, signature, message);
      
      // Update the user record with ENS name if not already set
      if (!user.ensAddress) {
        await storage.updateUserRole(user.id, user.role);
      }
      
      // If user is a journalist, mark as verified
      if (user.role === 'journalist') {
        // In a real app, this would involve additional checks
        const isVerified = await storage.isVerifiedJournalist(user.id);
        if (!isVerified) {
          // Add to verified journalists (implementation-specific)
          // This would involve additional validation in a real app
        }
      }
      
      res.json({ 
        success: true, 
        message: "ENS verification successful",
        ensAddress: ensName
      });
      
    } catch (error) {
      console.error('ENS verification error:', error);
      res.status(500).json({ message: "Error verifying ENS name" });
    }
  });
  
  // IPFS content storage
  app.post('/api/ipfs/store', authenticateUser, async (req, res) => {
    try {
      const { content, metadata } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Store content on IPFS (through Pinata in production)
      const hash = await ipfs.add(JSON.stringify(content), metadata);
      
      res.json({ 
        success: true, 
        ipfsHash: hash,
        url: ipfs.getUrl(hash)
      });
      
    } catch (error) {
      console.error('IPFS storage error:', error);
      res.status(500).json({ message: "Error storing content on IPFS" });
    }
  });
  
  // Token rewards
  app.post('/api/rewards/award', authenticateUser, async (req, res) => {
    try {
      // Only publishers can award tokens (in a full implementation, this would
      // be handled by a smart contract with proper access controls)
      if (req.user.role !== 'publisher') {
        return res.status(403).json({ message: "Only publishers can award tokens" });
      }
      
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ message: "User ID, amount, and reason are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Award tokens via blockchain (in production)
      // For demo, use the blockchain module to award tokens
      const address = user.ensAddress || await blockchain.generateAddress();
      const success = await blockchain.awardTokens(address, amount, reason);
      
      if (!success) {
        return res.status(500).json({ message: "Error awarding tokens" });
      }
      
      // Log the token award in storage
      const txHash = blockchain.getTransactionHistory()[0]?.hash;
      await storage.logTokenAward(userId, amount, reason, txHash);
      
      res.json({ 
        success: true, 
        message: `${amount} tokens awarded to ${user.username}`,
        txHash
      });
      
    } catch (error) {
      console.error('Token award error:', error);
      res.status(500).json({ message: "Error awarding tokens" });
    }
  });
  
  // Whistleblower submission  
  app.post('/api/whistleblower/submit', async (req, res) => {
    try {
      // No authentication required - whistleblowers submit anonymously
      const { content, signature, ipfsHash } = req.body;
      
      if (!content || !ipfsHash) {
        return res.status(400).json({ message: "Content and IPFS hash are required" });
      }
      
      // If signature is provided, verify it (optional)
      if (signature) {
        // This would verify the signature in a real implementation
        // For whistleblowers, this proves authenticity while preserving anonymity
      }
      
      // Create the article with whistleblower flag
      const articleData = insertArticleSchema.parse({
        ...content,
        ipfsHash,
        isWhistleblower: true,
        // Assign to a special system "anonymous" author ID in a real implementation
        // For demo, we use ID 1
        authorId: 1, 
        status: 'pending'
      });
      
      const article = await storage.createArticle(articleData);
      
      res.status(201).json({
        success: true,
        message: "Whistleblower submission received",
        articleId: article.id
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Whistleblower submission error:', error);
      res.status(500).json({ message: "Error processing whistleblower submission" });
    }
  });
  
  // Article truth verification
  app.post('/api/articles/:id/verify-truth', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Only publishers can verify truth
      if (req.user.role !== 'publisher') {
        return res.status(403).json({ message: "Only publishers can verify article truth" });
      }
      
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Calculate verification score
      const scoreData = await storage.getVerificationScore(id);
      
      // If score exceeds threshold (e.g. 70%), mark as verified
      if (scoreData.score >= 70 && article.status !== 'verified') {
        await storage.updateArticleStatus(id, 'verified');
        await storage.updateArticleTruthScore(id, scoreData.score);
        
        // Award tokens to the author (10 for regular articles, 15 for whistleblower)
        const tokenAmount = article.isWhistleblower ? 15 : 10;
        const author = await storage.getUser(article.authorId);
        
        if (author) {
          const address = author.ensAddress || await blockchain.generateAddress();
          await blockchain.awardTokens(address, tokenAmount, "Article verified");
          
          // Log the token award
          const txHash = blockchain.getTransactionHistory()[0]?.hash;
          await storage.logTokenAward(author.id, tokenAmount, "Article verified", txHash);
        }
        
        // Broadcast the verification via WebSocket
        broadcastEvent({
          type: 'article_verified',
          data: {
            articleId: id,
            score: scoreData.score,
            verificationCount: scoreData.totalCount
          }
        });
        
        res.json({ 
          success: true, 
          status: 'verified', 
          score: scoreData.score,
          message: "Article verified as true"
        });
      } 
      // If score is below threshold (e.g. 30%), mark as disproven
      else if (scoreData.score <= 30 && article.status !== 'disproven') {
        await storage.updateArticleStatus(id, 'disproven');
        await storage.updateArticleTruthScore(id, scoreData.score);
        
        // Broadcast the disproval via WebSocket
        broadcastEvent({
          type: 'article_disproven',
          data: {
            articleId: id,
            score: scoreData.score,
            verificationCount: scoreData.totalCount
          }
        });
        
        res.json({ 
          success: true, 
          status: 'disproven', 
          score: scoreData.score,
          message: "Article marked as false"
        });
      } 
      // If not enough verifications or score is inconclusive, keep as pending
      else {
        await storage.updateArticleTruthScore(id, scoreData.score);
        
        res.json({ 
          success: true, 
          status: article.status, 
          score: scoreData.score,
          message: "Article verification status updated"
        });
      }
    } catch (error) {
      console.error('Article truth verification error:', error);
      res.status(500).json({ message: "Error verifying article truth" });
    }
  });
  
  // Transaction endpoints
  app.get('/api/transactions/history', authenticateUser, async (req, res) => {
    try {
      // Get token award history for the user
      const awards = await storage.getTokenAwards(req.user.id);
      
      // Get blockchain transaction history (in a production app)
      const blockchainTransactions = blockchain.getTransactionHistory();
      
      res.json({
        tokenAwards: awards,
        blockchainTransactions: blockchainTransactions.slice(0, 5) // Limit to most recent 5
      });
    } catch (error) {
      console.error('Transaction history error:', error);
      res.status(500).json({ message: "Error fetching transaction history" });
    }
  });
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients
  const clients = new Set<WebSocket>();
  
  // Event broadcasting function
  function broadcastEvent(eventData: any) {
    const message = JSON.stringify(eventData);
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Set up WebSocket server
  wss.on('connection', (ws) => {
    // Add new client to the set
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to DecentralizedTruth real-time updates'
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle client requests - this would be more extensive in a real app
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      clients.delete(ws);
    });
  });
  
  return httpServer;
}
