import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles: publisher, journalist, community
export const userRoles = ["publisher", "journalist", "community"] as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("community"),
  ensAddress: text("ens_address"),
  bio: text("bio"),
  avatar: text("avatar"),
  reputation: integer("reputation").default(50),
  truthTokens: integer("truth_tokens").default(0),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
  reputation: true,
  truthTokens: true,
});

// Article verification statuses: pending, verified, disproven
export const verificationStatuses = ["pending", "verified", "disproven"] as const;

// Articles table
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  ipfsHash: text("ipfs_hash").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").notNull(),
  status: text("status", { enum: verificationStatuses }).notNull().default("pending"),
  isWhistleblower: boolean("is_whistleblower").default(false),
  category: text("category").notNull(),
  verificationCount: integer("verification_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  verificationCount: true,
  createdAt: true,
});

// Evidence types: supporting, contradicting, contextual
export const evidenceTypes = ["supporting", "contradicting", "contextual"] as const;

// Evidence table
export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: evidenceTypes }).notNull(),
  description: text("description").notNull(),
  files: jsonb("files"),
  ipfsHash: text("ipfs_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  tokenReward: integer("token_reward"),
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  createdAt: true,
  tokenReward: true,
});

// Verification table
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status", { enum: verificationStatuses }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  createdAt: true,
});

// Publisher application
export const publisherApplications = pgTable("publisher_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  organization: text("organization").notNull(),
  website: text("website").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPublisherApplicationSchema = createInsertSchema(publisherApplications).omit({
  id: true,
  status: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type PublisherApplication = typeof publisherApplications.$inferSelect;
export type InsertPublisherApplication = z.infer<typeof insertPublisherApplicationSchema>;
