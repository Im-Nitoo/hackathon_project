import fetch from 'node-fetch';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Pinata credentials
const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.VITE_PINATA_API_SECRET;
const PINATA_JWT = process.env.VITE_PINATA_JWT;
const isConfigured = PINATA_API_KEY && PINATA_API_SECRET && PINATA_JWT;

// IPFS client for server-side operations
export const ipfs = {
  async add(content: string, metadata: any = {}) {
    if (!isConfigured) {
      // Fall back to simulation mode if not configured
      console.log('[IPFS Server] No Pinata credentials, using simulation mode');
      const hash = `Qm${crypto.randomBytes(44).toString('base64').replace(/[+/=]/g, '')}`;
      return hash;
    }
    
    try {
      console.log('[IPFS Server] Storing content with Pinata');
      
      // Create JSON file with content
      const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
      const jsonContent = JSON.stringify(contentObj);
      
      // Prepare the request body as FormData
      const formData = new FormData();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      formData.append('file', blob, 'content.json');
      
      const pinataMetadata = JSON.stringify({
        name: metadata.name || 'DecentralizedTruth Content',
        keyvalues: {
          app: 'DecentralizedTruth',
          timestamp: Date.now().toString(),
          type: metadata.type || 'article',
          ...metadata
        }
      });
      
      formData.append('pinataMetadata', pinataMetadata);
      
      // Make request to Pinata API
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json() as { IpfsHash: string };
      console.log('[IPFS Server] Content stored successfully:', result.IpfsHash);
      
      return result.IpfsHash;
    } catch (error) {
      console.error('[IPFS Server] Error storing content:', error);
      // Fall back to simulation for error cases
      const hash = `Qm${crypto.randomBytes(44).toString('base64').replace(/[+/=]/g, '')}`;
      return hash;
    }
  },
  
  async get(hash: string) {
    try {
      if (!isConfigured) {
        console.log('[IPFS Server] No Pinata credentials, using simulation mode');
        return JSON.stringify({
          title: "Mock IPFS Content",
          content: "This is mock content retrieved from IPFS"
        });
      }
      
      console.log(`[IPFS Server] Retrieving content with hash: ${hash}`);
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
      
      const response = await fetch(gatewayUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`[IPFS Server] Error retrieving content with hash ${hash}:`, error);
      // Return mock data in case of error
      return JSON.stringify({
        title: "Error Content",
        content: "Could not retrieve the requested content"
      });
    }
  },
  
  getUrl(hash: string) {
    if (isConfigured) {
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    } else {
      return `https://ipfs.io/ipfs/${hash}`;
    }
  },
  
  async unpin(hash: string) {
    if (!isConfigured) {
      console.log('[IPFS Server] No Pinata credentials, using simulation mode');
      return true;
    }
    
    try {
      console.log(`[IPFS Server] Unpinning content with hash: ${hash}`);
      
      const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      console.log(`[IPFS Server] Successfully unpinned ${hash}`);
      return true;
    } catch (error) {
      console.error(`[IPFS Server] Error unpinning ${hash}:`, error);
      return false;
    }
  }
};