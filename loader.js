/**
 * RE Cost Seg - Schema Markup Loader v1.0
 * Dynamically loads and injects schema markup based on current page
 * 
 * @author RE Cost Seg
 * @license MIT
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    version: '1.0.0',
    githubRepo: 'Joao-Aquino/recostseg-schemas',
    branch: 'main',
    cdnUrl: 'https://cdn.jsdelivr.net/gh/',
    cacheTime: 3600, // 1 hour cache
    debug: window.location.hostname.includes('webflow.io') || window.location.hostname === 'localhost'
  };

  // Page to schema mapping
  const SCHEMA_MAP = {
    '/': 'homepage.json',
    '/index': 'homepage.json',
    '/services': 'services.json',
    '/services/rapid-report': 'rapid-report.json',
    '/services/engineered-study': 'engineered-study.json',
    '/free-proposal': 'free-proposal.json',
    '/faq': 'faq.json',
    '/resources': 'resources.json',
    '/contact': 'contact.json',
    '/about': 'about.json'
  };

  // Pattern-based schema selection
  const PATTERN_MAP = [
    { pattern: /^\/post\//, schema: 'blog-post.json' },
    { pattern: /^\/case-study\//, schema: 'case-study.json' },
    { pattern: /^\/state\//, schema: 'location.json' }
  ];

  /**
   * Logger utility
   */
  const log = {
    info: (...args) => CONFIG.debug && console.log('📋 Schema Loader:', ...args),
    error: (...args) => console.error('❌ Schema Loader Error:', ...args),
    success: (...args) => CONFIG.debug && console.log('✅ Schema Loaded:', ...args)
  };

  /**
   * Get schema filename for current page
   */
  function getSchemaFile() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    
    // Check exact match
    if (SCHEMA_MAP[path]) {
      return SCHEMA_MAP[path];
    }
    
    // Check pattern matches
    for (const { pattern, schema } of PATTERN_MAP) {
      if (pattern.test(path)) {
        return schema;
      }
    }
    
    // Default schema
    return 'default.json';
  }

  /**
   * Build CDN URL with cache busting
   */
  function buildSchemaUrl(filename) {
    const timestamp = Math.floor(Date.now() / (CONFIG.cacheTime * 1000));
    return `${CONFIG.cdnUrl}${CONFIG.githubRepo}@${CONFIG.branch}/schemas/${filename}?t=${timestamp}`;
  }

  /**
   * Extract page metadata
   */
  function getPageMetadata() {
    return {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      image: document.querySelector('meta[property="og:image"]')?.content || '',
      published: document.querySelector('meta[property="article:published_time"]')?.content || '',
      modified: new Date().toISOString(),
      author: document.querySelector('meta[name="author"]')?.content || 'RE Cost Seg',
      lang: document.documentElement.lang || 'en-US'
    };
  }

  /**
   * Process schema with dynamic replacements
   */
  function processSchema(schema) {
    const metadata = getPageMetadata();
    let schemaString = JSON.stringify(schema);
    
    // Define replacements
    const replacements = {
      '{{CURRENT_URL}}': metadata.url,
      '{{PAGE_TITLE}}': metadata.title,
      '{{META_DESCRIPTION}}': metadata.description,
      '{{OG_IMAGE}}': metadata.image,
      '{{PUBLISHED_DATE}}': metadata.published || metadata.modified,
      '{{MODIFIED_DATE}}': metadata.modified,
      '{{AUTHOR}}': metadata.author,
      '{{LANGUAGE}}': metadata.lang,
      '{{YEAR}}': new Date().getFullYear().toString()
    };
    
    // Apply replacements
    Object.entries(replacements).forEach(([key, value]) => {
      schemaString = schemaString.replace(new RegExp(key, 'g'), value);
    });
    
    return JSON.parse(schemaString);
  }

  /**
   * Inject schema into page
   */
  function injectSchema(schemaData) {
    // Remove existing schema
    document.querySelectorAll('script[data-schema-loader="recostseg"]').forEach(el => el.remove());
    
    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-loader', 'recostseg');
    script.textContent = JSON.stringify(schemaData, null, CONFIG.debug ? 2 : 0);
    
    // Inject into head
    document.head.appendChild(script);
    
    log.success(getSchemaFile(), schemaData);
  }

  /**
   * Load and apply schema
   */
  async function loadSchema() {
    try {
      const schemaFile = getSchemaFile();
      const schemaUrl = buildSchemaUrl(schemaFile);
      
      log.info(`Loading schema: ${schemaFile}`);
      
      // Fetch from CDN
      const response = await fetch(schemaUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const schemaData = await response.json();
      const processedSchema = processSchema(schemaData);
      
      injectSchema(processedSchema);
      
      // Send success event
      window.dispatchEvent(new CustomEvent('schemaLoaded', { 
        detail: { file: schemaFile, schema: processedSchema } 
      }));
      
    } catch (error) {
      log.error(error);
      
      // Inject fallback schema
      const fallback = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "RE Cost Seg",
        "url": "https://www.recostseg.com",
        "telephone": "+1 (346) 214-6539"
      };
      
      injectSchema(fallback);
    }
  }

  /**
   * Initialize
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadSchema);
    } else {
      loadSchema();
    }
    
    // Support for Webflow's AJAX navigation
    window.addEventListener('swup:contentReplaced', loadSchema);
    window.addEventListener('turbo:load', loadSchema);
  }
  
  // Start
  init();
  
})();