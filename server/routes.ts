import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as crypto from "crypto";
import { 
  insertUserSchema, 
  insertArticleSchema, 
  insertEvidenceSchema, 
  insertVerificationSchema,
  insertPublisherApplicationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
  
  const httpServer = createServer(app);
  return httpServer;
}
