// Enhanced IPFS client that uses Pinata for pinning content
// In a production environment, we would use ipfs-http-client with a real IPFS node

/**
 * IPFS client for storing and retrieving content
 * Uses Pinata API for pinning in production
 */
class IPFSClient {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private pinataJWT: string | null = null;
  private baseApiUrl = 'https://api.pinata.cloud';
  private gatewayUrl = 'https://ipfs.io/ipfs/';
  private isConfigured = false;

  constructor() {
    // Try to get environment variables if available
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY || null;
    this.apiSecret = import.meta.env.VITE_PINATA_API_SECRET || null;
    this.pinataJWT = import.meta.env.VITE_PINATA_JWT || null;
    
    this.isConfigured = !!(this.apiKey && this.apiSecret) || !!this.pinataJWT;
    
    if (this.isConfigured) {
      console.log('[IPFS] Pinata connection configured');
    } else {
      console.warn('[IPFS] Running in simulation mode - no Pinata API keys found');
    }
  }

  /**
   * Store content on IPFS via Pinata and return the hash
   * @param content Content to store (string or Blob)
   * @param metadata Optional metadata for the content
   */
  async add(content: string | Blob, metadata: { name?: string, description?: string, articleData?: any } = {}): Promise<string> {
    if (!this.isConfigured) {
      return this.simulateAdd(content, metadata);
    }
    
    try {
      const formData = new FormData();
      
      // Prepare the file
      if (typeof content === 'string') {
        // Convert string to blob
        const blob = new Blob([content], { type: 'application/json' });
        formData.append('file', blob, 'article.json');
      } else {
        formData.append('file', content);
      }
      
      // Add metadata
      const pinataMetadata = {
        name: metadata.name || `DecentralizedTruth_${new Date().toISOString()}`,
        keyvalues: {
          description: metadata.description || 'Content stored via DecentralizedTruth platform',
          timestamp: new Date().toISOString(),
          ...metadata.articleData
        }
      };
      
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      
      // Set pinata options
      const pinataOptions = {
        cidVersion: 0,
        wrapWithDirectory: false
      };
      
      formData.append('pinataOptions', JSON.stringify(pinataOptions));
      
      // Make the request
      const headers: HeadersInit = {};
      if (this.pinataJWT) {
        headers.Authorization = `Bearer ${this.pinataJWT}`;
      } else if (this.apiKey && this.apiSecret) {
        headers.pinata_api_key = this.apiKey;
        headers.pinata_secret_api_key = this.apiSecret;
      }
      
      const response = await fetch(`${this.baseApiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      const hash = data.IpfsHash;
      console.log(`[IPFS] Content successfully pinned with hash: ${hash}`);
      return hash;
      
    } catch (error) {
      console.error('[IPFS] Error pinning content:', error);
      // Fall back to simulation if API call fails
      return this.simulateAdd(content, metadata);
    }
  }
  
  /**
   * Retrieve content from IPFS by hash
   * @param hash IPFS CID/hash
   */
  async get(hash: string): Promise<string> {
    try {
      if (!hash || !hash.startsWith('Q')) {
        throw new Error('Invalid IPFS hash format');
      }
      
      const url = `${this.gatewayUrl}${hash}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS gateway: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`[IPFS] Error retrieving content for hash ${hash}:`, error);
      return this.simulateGet(hash);
    }
  }
  
  /**
   * Unpin content from Pinata
   * @param hash IPFS CID/hash to unpin
   */
  async unpin(hash: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[IPFS] Simulation: Unpinned ${hash}`);
      return true;
    }
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (this.pinataJWT) {
        headers.Authorization = `Bearer ${this.pinataJWT}`;
      } else if (this.apiKey && this.apiSecret) {
        headers.pinata_api_key = this.apiKey;
        headers.pinata_secret_api_key = this.apiSecret;
      }
      
      const response = await fetch(`${this.baseApiUrl}/pinning/unpin/${hash}`, {
        method: 'DELETE',
        headers
      });
      
      return response.ok;
    } catch (error) {
      console.error(`[IPFS] Error unpinning hash ${hash}:`, error);
      return false;
    }
  }
  
  /**
   * Get the complete gateway URL for a hash
   * @param hash IPFS CID/hash
   */
  getUrl(hash: string): string {
    return `${this.gatewayUrl}${hash}`;
  }
  
  // Simulate adding content to IPFS
  private simulateAdd(content: string | Blob, metadata: any = {}): Promise<string> {
    return new Promise(resolve => {
      // Simulate network delay
      setTimeout(() => {
        // Generate a fake IPFS hash
        const hash = this.generateFakeIPFSHash();
        console.log(`[IPFS] Simulation: Content stored with hash: ${hash}`, { metadata });
        resolve(hash);
      }, 1000);
    });
  }
  
  // Simulate retrieving content from IPFS
  private simulateGet(hash: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        if (hash && hash.startsWith('Q')) {
          // If it's an article hash, return simulated JSON content
          if (hash.includes('article')) {
            resolve(JSON.stringify({
              title: 'Simulated Article from IPFS',
              content: 'This is simulated content retrieved from IPFS in development mode.',
              timestamp: new Date().toISOString()
            }));
          } else {
            resolve(`Content for IPFS hash: ${hash} (simulated in development mode)`);
          }
        } else {
          reject(new Error('Invalid IPFS hash'));
        }
      }, 800);
    });
  }
  
  // Generate a fake IPFS hash that looks realistic
  private generateFakeIPFSHash(): string {
    // IPFS hashes typically start with "Qm" followed by base58 characters
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const length = 44; // Typical length for IPFS CIDv0
    
    let hash = 'Qm';
    for (let i = 0; i < length - 2; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return hash;
  }
}

export const ipfs = new IPFSClient();
