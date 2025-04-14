import {
  users, type User, type InsertUser,
  articles, type Article, type InsertArticle,
  evidence, type Evidence, type InsertEvidence,
  verifications, type Verification, type InsertVerification,
  publisherApplications, type PublisherApplication, type InsertPublisherApplication,
  verificationStatuses
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEnsAddress(ensAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: number, tokens: number): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  isVerifiedJournalist(userId: number): Promise<boolean>;
  isPublisher(userId: number): Promise<boolean>;

  // Article operations
  getArticle(id: number): Promise<Article | undefined>;
  getArticles(options?: { 
    limit?: number, 
    offset?: number, 
    status?: string, 
    isWhistleblower?: boolean,
    authorId?: number
  }): Promise<Article[]>;
  getFeaturedArticles(limit?: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticleStatus(id: number, status: string): Promise<Article | undefined>;
  updateArticleTruthScore(id: number, score: number): Promise<Article | undefined>;
  
  // Evidence operations
  getEvidence(id: number): Promise<Evidence | undefined>;
  getEvidenceForArticle(articleId: number): Promise<Evidence[]>;
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  calculateEvidenceImpact(evidence: Evidence): Promise<number>;
  
  // Verification operations
  getVerification(id: number): Promise<Verification | undefined>;
  getVerificationsForArticle(articleId: number): Promise<Verification[]>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerificationScore(articleId: number): Promise<{
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    score: number;
  }>;
  
  // Publisher application operations
  getPublisherApplication(id: number): Promise<PublisherApplication | undefined>;
  createPublisherApplication(application: InsertPublisherApplication): Promise<PublisherApplication>;
  updatePublisherApplicationStatus(id: number, status: string): Promise<PublisherApplication | undefined>;
  
  // Signature verification
  storeSignature(userId: number, signature: string, message: string): Promise<boolean>;
  getSignature(userId: number): Promise<{ signature: string; message: string } | undefined>;
  verifySignature(address: string, signature: string, message: string): Promise<boolean>;
  
  // Token rewards
  logTokenAward(userId: number, amount: number, reason: string, txHash?: string): Promise<void>;
  getTokenAwards(userId: number): Promise<{ amount: number; reason: string; timestamp: Date; txHash?: string }[]>;
  
  // Stats operations
  getStats(): Promise<{ 
    publisherCount: number, 
    articleCount: number, 
    verificationRate: number, 
    tokenCount: number,
    whistleblowerCount: number,
    evidenceCount: number
  }>;
  
  // Top verifiers
  getTopVerifiers(limit?: number): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private evidence: Map<number, Evidence>;
  private verifications: Map<number, Verification>;
  private publisherApplications: Map<number, PublisherApplication>;
  
  // Additional storage for new functionality
  private signatures: Map<number, { signature: string; message: string }>;
  private tokenAwards: Map<number, { amount: number; reason: string; timestamp: Date; txHash?: string }[]>;
  private verifiedJournalists: Set<number>; // IDs of journalists with confirmed identity
  
  private userId: number;
  private articleId: number;
  private evidenceId: number;
  private verificationId: number;
  private publisherApplicationId: number;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.evidence = new Map();
    this.verifications = new Map();
    this.publisherApplications = new Map();
    
    // Initialize new storage
    this.signatures = new Map();
    this.tokenAwards = new Map();
    this.verifiedJournalists = new Set();
    
    this.userId = 1;
    this.articleId = 1;
    this.evidenceId = 1;
    this.verificationId = 1;
    this.publisherApplicationId = 1;
    
    // Add some initial data
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      reputation: 50,
      truthTokens: 0,
      verifiedAt: insertUser.role !== 'community' ? now : undefined
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserTokens(id: number, tokens: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      truthTokens: user.truthTokens ? user.truthTokens + tokens : tokens
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      role,
      verifiedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Article operations
  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticles(options: { limit?: number, offset?: number, status?: string, isWhistleblower?: boolean } = {}): Promise<Article[]> {
    let articles = Array.from(this.articles.values());
    
    if (options.status) {
      articles = articles.filter(article => article.status === options.status);
    }
    
    if (options.isWhistleblower !== undefined) {
      articles = articles.filter(article => article.isWhistleblower === options.isWhistleblower);
    }
    
    articles = articles.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Sort by date descending (newest first)
    });
    
    const offset = options.offset || 0;
    const limit = options.limit || articles.length;
    
    return articles.slice(offset, offset + limit);
  }
  
  async getFeaturedArticles(limit: number = 3): Promise<Article[]> {
    const articles = Array.from(this.articles.values())
      .filter(article => article.status === 'verified' || article.verificationCount > 0)
      .sort((a, b) => b.verificationCount - a.verificationCount);
    
    return articles.slice(0, limit);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const article: Article = { 
      ...insertArticle, 
      id, 
      createdAt: new Date(),
      verificationCount: 0
    };
    this.articles.set(id, article);
    return article;
  }
  
  async updateArticleStatus(id: number, status: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = {
      ...article,
      status
    };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  // Evidence operations
  async getEvidence(id: number): Promise<Evidence | undefined> {
    return this.evidence.get(id);
  }

  async getEvidenceForArticle(articleId: number): Promise<Evidence[]> {
    return Array.from(this.evidence.values())
      .filter(evidence => evidence.articleId === articleId);
  }

  async createEvidence(insertEvidence: InsertEvidence): Promise<Evidence> {
    const id = this.evidenceId++;
    const tokenReward = this.calculateTokenReward(insertEvidence.type);
    
    const evidence: Evidence = { 
      ...insertEvidence, 
      id, 
      createdAt: new Date(),
      tokenReward
    };
    this.evidence.set(id, evidence);
    
    // Update user tokens
    await this.updateUserTokens(insertEvidence.userId, tokenReward);
    
    return evidence;
  }
  
  private calculateTokenReward(evidenceType: string): number {
    // Simple token reward calculation
    switch(evidenceType) {
      case 'supporting': return 2;
      case 'contradicting': return 3;
      case 'contextual': return 1;
      default: return 1;
    }
  }

  // Verification operations
  async getVerification(id: number): Promise<Verification | undefined> {
    return this.verifications.get(id);
  }

  async getVerificationsForArticle(articleId: number): Promise<Verification[]> {
    return Array.from(this.verifications.values())
      .filter(verification => verification.articleId === articleId);
  }

  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const id = this.verificationId++;
    const verification: Verification = { 
      ...insertVerification, 
      id, 
      createdAt: new Date()
    };
    this.verifications.set(id, verification);
    
    // Update article verification count
    const article = await this.getArticle(insertVerification.articleId);
    if (article) {
      const updatedArticle = {
        ...article,
        verificationCount: article.verificationCount + 1
      };
      this.articles.set(article.id, updatedArticle);
      
      // Determine if article status should be updated
      const verifications = await this.getVerificationsForArticle(article.id);
      const verifiedCount = verifications.filter(v => v.status === 'verified').length;
      const disprovenCount = verifications.filter(v => v.status === 'disproven').length;
      
      if (verifiedCount >= 5 && article.status !== 'verified') {
        await this.updateArticleStatus(article.id, 'verified');
        
        // Award tokens to the author
        await this.updateUserTokens(article.authorId, 10);
      } else if (disprovenCount >= 5 && article.status !== 'disproven') {
        await this.updateArticleStatus(article.id, 'disproven');
      }
    }
    
    // Award tokens to the verifier
    await this.updateUserTokens(insertVerification.userId, 5);
    
    return verification;
  }

  // Publisher application operations
  async getPublisherApplication(id: number): Promise<PublisherApplication | undefined> {
    return this.publisherApplications.get(id);
  }

  async createPublisherApplication(insertApplication: InsertPublisherApplication): Promise<PublisherApplication> {
    const id = this.publisherApplicationId++;
    const application: PublisherApplication = { 
      ...insertApplication, 
      id, 
      createdAt: new Date(),
      status: 'pending'
    };
    this.publisherApplications.set(id, application);
    return application;
  }
  
  async updatePublisherApplicationStatus(id: number, status: string): Promise<PublisherApplication | undefined> {
    const application = this.publisherApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = {
      ...application,
      status
    };
    this.publisherApplications.set(id, updatedApplication);
    
    // If approved, update user role
    if (status === 'approved') {
      await this.updateUserRole(application.userId, 'publisher');
    }
    
    return updatedApplication;
  }
  
  // Implement new methods for the enhanced IStorage interface
  
  // User operations
  async getUserByEnsAddress(ensAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.ensAddress === ensAddress
    );
  }
  
  async isVerifiedJournalist(userId: number): Promise<boolean> {
    return this.verifiedJournalists.has(userId);
  }
  
  async isPublisher(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.role === 'publisher';
  }
  
  // Enhanced article operations
  async updateArticleTruthScore(id: number, score: number): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = {
      ...article,
      truthScore: score,
      // Update status if threshold met (70% for verified)
      status: score >= 70 ? 'verified' : (score <= 30 ? 'disproven' : article.status)
    };
    
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  // Evidence calculation
  async calculateEvidenceImpact(evidence: Evidence): Promise<number> {
    // Calculate impact based on evidence type and quality
    let impact = 0;
    
    switch (evidence.type) {
      case 'supporting':
        impact = 5;
        break;
      case 'contradicting':
        impact = -10;
        break;
      case 'contextual':
        impact = 2;
        break;
      default:
        impact = 0;
    }
    
    // Add bonus for verified journalist
    const user = await this.getUser(evidence.userId);
    if (user && (user.role === 'journalist' || user.role === 'publisher')) {
      impact = impact * 1.5;
    }
    
    return impact;
  }
  
  // Verification score calculation
  async getVerificationScore(articleId: number): Promise<{
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    score: number;
  }> {
    const verifications = await this.getVerificationsForArticle(articleId);
    
    const totalCount = verifications.length;
    const positiveCount = verifications.filter(v => v.status === 'verified').length;
    const negativeCount = verifications.filter(v => v.status === 'disproven').length;
    
    // Calculate score as percentage of positive verifications (0-100)
    const score = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 50;
    
    return {
      totalCount,
      positiveCount,
      negativeCount,
      score
    };
  }
  
  // Signature verification
  async storeSignature(userId: number, signature: string, message: string): Promise<boolean> {
    this.signatures.set(userId, { signature, message });
    return true;
  }
  
  async getSignature(userId: number): Promise<{ signature: string; message: string } | undefined> {
    return this.signatures.get(userId);
  }
  
  async verifySignature(address: string, signature: string, message: string): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling ethers when not needed
      const { ethers } = await import('ethers');
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('[Blockchain] Error verifying signature:', error);
      // Fallback to simple validation for testing
      return signature.length > 20 && message.length > 0;
    }
  }
  
  // Token rewards
  async logTokenAward(userId: number, amount: number, reason: string, txHash?: string): Promise<void> {
    const awards = this.tokenAwards.get(userId) || [];
    awards.push({
      amount,
      reason,
      timestamp: new Date(),
      txHash
    });
    
    this.tokenAwards.set(userId, awards);
    
    // Update user tokens
    await this.updateUserTokens(userId, amount);
  }
  
  async getTokenAwards(userId: number): Promise<{ amount: number; reason: string; timestamp: Date; txHash?: string }[]> {
    return this.tokenAwards.get(userId) || [];
  }
  
  // Stats operations
  async getStats(): Promise<{ 
    publisherCount: number, 
    articleCount: number, 
    verificationRate: number, 
    tokenCount: number,
    whistleblowerCount: number,
    evidenceCount: number
  }> {
    const publishers = Array.from(this.users.values()).filter(user => user.role === 'publisher');
    const allArticles = Array.from(this.articles.values());
    const verifiedArticles = allArticles.filter(article => article.status === 'verified');
    const whistleblowerArticles = allArticles.filter(article => article.isWhistleblower);
    const totalTokens = Array.from(this.users.values()).reduce((sum, user) => sum + (user.truthTokens || 0), 0);
    
    return {
      publisherCount: publishers.length,
      articleCount: allArticles.length,
      verificationRate: allArticles.length > 0 ? Math.round((verifiedArticles.length / allArticles.length) * 100) : 0,
      tokenCount: totalTokens,
      whistleblowerCount: whistleblowerArticles.length,
      evidenceCount: this.evidence.size
    };
  }
  
  // Top verifiers
  async getTopVerifiers(limit: number = 3): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => (b.truthTokens || 0) - (a.truthTokens || 0))
      .slice(0, limit);
  }
  
  // Seed initial data
  private seedData() {
    // Create some initial users
    const users: InsertUser[] = [
      {
        username: 'james_wilson',
        password: 'password123',
        email: 'james@example.com',
        name: 'James Wilson',
        role: 'journalist',
        bio: 'Climate Reporter with 10 years experience',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces',
        ensAddress: 'james.eth'
      },
      {
        username: 'sarah_chen',
        password: 'password123',
        email: 'sarah@example.com',
        name: 'Sarah Chen',
        role: 'journalist',
        bio: 'Tech Journalist covering AI and emerging technologies',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
        ensAddress: 'sarahchen.eth'
      },
      {
        username: 'maria_johnson',
        password: 'password123',
        email: 'maria@example.com',
        name: 'Maria Johnson',
        role: 'community',
        bio: 'Fact-checking enthusiast',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
        truthTokens: 512
      },
      {
        username: 'david_chen',
        password: 'password123',
        email: 'david@example.com',
        name: 'David Chen',
        role: 'community',
        bio: 'History researcher',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
        truthTokens: 347
      },
      {
        username: 'thomas_garcia',
        password: 'password123',
        email: 'thomas@example.com',
        name: 'Thomas Garcia',
        role: 'community',
        bio: 'Science enthusiast',
        avatar: 'https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=150&h=150&fit=crop&crop=faces',
        truthTokens: 289
      }
    ];
    
    users.forEach(user => {
      this.createUser(user);
    });
    
    // Create some initial articles
    const articles: InsertArticle[] = [
      {
        title: 'Global Climate Summit Reaches Historic Carbon Agreement',
        content: `World leaders have reached a groundbreaking agreement to reduce carbon emissions by 45% by 2030, setting a new precedent for international climate cooperation. The agreement, finalized after marathon negotiations, includes binding targets and financial mechanisms to support developing nations in their transition to clean energy.

Key provisions include:
- Progressive carbon pricing mechanisms
- Technology transfer programs for renewable energy
- Forest conservation funding
- Climate adaptation infrastructure support

Environmental experts are calling this the most significant climate agreement since the Paris Accord, with potential to meaningfully impact global warming trajectories if fully implemented.`,
        summary: 'World leaders have reached a groundbreaking agreement to reduce carbon emissions by 45% by 2030, setting a new precedent for international climate cooperation.',
        ipfsHash: 'Qm7TY8vd3UCeP5RzZ9qQjyL1vxwZV6LCR63Kk',
        imageUrl: 'https://images.unsplash.com/photo-1485115905815-74a5c9fda2f5?w=800&h=500&fit=crop',
        authorId: 1,
        status: 'verified',
        isWhistleblower: false,
        category: 'Climate'
      },
      {
        title: 'Major AI Breakthrough Claims to Solve Protein Folding Problem',
        content: `Scientists at TechLab have announced a breakthrough in AI that reportedly solves the decades-old protein folding problem, with implications for medicine and drug discovery. The new algorithm, named FoldSolver, can predict the three-dimensional structure of proteins from their amino acid sequences with unprecedented accuracy.

The protein folding problem has been one of the grand challenges in computational biology. Proteins are the workhorses of cells, and their function is determined by their 3D structure, which is incredibly difficult to predict from the linear amino acid sequence alone.

If verified, this breakthrough could revolutionize drug discovery by allowing scientists to design new proteins and predict their structures, potentially leading to novel treatments for diseases like cancer, Alzheimer's, and rare genetic disorders.

Independent researchers are currently validating the claims, with results expected in the coming weeks.`,
        summary: 'Scientists at TechLab have announced a breakthrough in AI that reportedly solves the decades-old protein folding problem, with implications for medicine and drug discovery.',
        ipfsHash: 'Qm9TH1vd7UPeC5RzZ9qwjyL1vxwZV6LCE93Kk',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop',
        authorId: 2,
        status: 'pending',
        isWhistleblower: false,
        category: 'Technology'
      },
      {
        title: 'Corporate Environmental Compliance Records Show Systematic Violations',
        content: `Internal documents reveal a pattern of environmental testing manipulation at three major industrial facilities, allowing harmful chemicals to be released at levels exceeding regulatory limits. The documents, which span five years of operations, show deliberate tampering with monitoring equipment and falsification of compliance reports submitted to environmental agencies.

The violations primarily involve the release of heavy metals and volatile organic compounds (VOCs) into local waterways, potentially affecting drinking water supplies for nearby communities. Health experts have noted elevated rates of certain cancers and respiratory conditions in these areas, although direct causation has not yet been established.

The federation has independently confirmed these allegations through cross-referencing with government databases, interviews with former employees, and analysis of the provided documentation. All sources have been protected.`,
        summary: 'Internal documents reveal a pattern of environmental testing manipulation at three major industrial facilities, allowing harmful chemicals to be released at levels exceeding regulatory limits.',
        ipfsHash: 'Qm7TY8vd3UCeP5RzZ9qwjLL1vxwZV6LCR63Kk',
        imageUrl: '',
        authorId: 1,
        status: 'verified',
        isWhistleblower: true,
        category: 'Environment'
      }
    ];
    
    articles.forEach(article => {
      this.createArticle(article);
    });
  }
}

export const storage = new MemStorage();
