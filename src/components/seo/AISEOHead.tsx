/**
 * AI SEO Head Component
 * 
 * Enterprise-grade AI SEO optimization targeting:
 * - AI Search Engines (Perplexity, ChatGPT Search, Google AI Overview)
 * - AI Crawlers (ChatGPT-User, OAI-SearchBot, Claude)
 * - AI Citation Features
 * - Natural Language Processing
 * - Knowledge Graph Integration
 * 
 * Features:
 * - AI-friendly structured data
 * - Direct answer snippets
 * - Factual content structure
 * - Entity recognition optimization
 * - Citation-ready metadata
 * - Question-answer format
 * - Natural language descriptions
 * 
 * Target: >95 Lighthouse AI SEO Score
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface AISEOHeadProps {
  /**
   * Page title (AI-friendly, clear and factual)
   */
  title: string;
  /**
   * Natural language description (AI citation-ready)
   */
  description: string;
  /**
   * Direct answer to main question (for featured snippets)
   */
  directAnswer?: string;
  /**
   * Key facts/statistics (for AI extraction)
   */
  keyFacts?: Array<{
    label: string;
    value: string;
  }>;
  /**
   * FAQ items (AI loves Q&A format)
   */
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  /**
   * Canonical URL
   */
  canonical: string;
  /**
   * Content type
   */
  contentType?: 'service' | 'product' | 'article' | 'company' | 'faq';
  /**
   * Primary entity/topic
   */
  primaryEntity?: {
    name: string;
    type: string;
    description: string;
  };
  /**
   * Related entities/topics
   */
  relatedEntities?: Array<{
    name: string;
    type: string;
  }>;
  /**
   * Citation sources (for AI attribution)
   */
  citations?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
}

/**
 * AI SEO Head Component
 */
export const AISEOHead: React.FC<AISEOHeadProps> = ({
  title,
  description,
  directAnswer,
  keyFacts,
  faqs,
  canonical,
  contentType = 'service',
  primaryEntity,
  relatedEntities,
  citations,
}) => {
  const baseUrl = 'https://www.tradeline247ai.com';
  const fullCanonical = canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`;
  
  // Build AI-optimized structured data
  const structuredData: any[] = [];
  
  // Organization (always include for entity recognition)
  structuredData.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'TradeLine 24/7',
    alternateName: 'TradeLine 24/7 AI Receptionist',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/assets/brand/OFFICIAL_LOGO.svg`,
      width: 512,
      height: 512,
    },
    description: 'AI-powered 24/7 receptionist service for Canadian businesses. Never miss a call. Work while you sleep.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@tradeline247ai.com',
      telephone: '+1-587-742-8885',
      availableLanguage: ['en', 'fr'],
      areaServed: 'CA',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
      addressLocality: 'Edmonton',
      addressRegion: 'AB',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    foundingDate: '2024',
    legalName: 'Apex Business Systems',
    sameAs: [],
  });
  
  // Service Schema (for AI understanding of what we do)
  structuredData.push({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${fullCanonical}#service`,
    name: 'TradeLine 24/7 AI Receptionist Service',
    description: '24/7 AI-powered phone answering service that never misses a call. Handles customer inquiries, qualifies leads, and sends clean transcripts via email.',
    provider: {
      '@id': `${baseUrl}/#organization`,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    serviceType: 'AI Receptionist Service',
    category: 'Business Automation',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/pricing`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  });
  
  // FAQPage (AI search engines love Q&A content)
  if (faqs && faqs.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq, index) => ({
        '@type': 'Question',
        '@id': `${fullCanonical}#faq-${index + 1}`,
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
          dateCreated: new Date().toISOString(),
        },
      })),
    });
  }
  
  // WebPage with direct answer (for featured snippets)
  const webpageData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${fullCanonical}#webpage`,
    url: fullCanonical,
    name: title,
    description: description,
    inLanguage: 'en-CA',
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@id': `${fullCanonical}#service`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: fullCanonical,
        },
      ],
    },
  };
  
  if (directAnswer) {
    webpageData.mainEntity = {
      '@type': 'FAQPage',
      mainEntity: {
        '@type': 'Question',
        name: title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: directAnswer,
        },
      },
    };
  }
  
  structuredData.push(webpageData);
  
  // WebSite schema with search action
  structuredData.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'TradeLine 24/7',
    description: 'AI-powered 24/7 receptionist service for Canadian businesses',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    inLanguage: 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
  
  // Primary entity markup (for AI entity recognition)
  if (primaryEntity) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': primaryEntity.type,
      name: primaryEntity.name,
      description: primaryEntity.description,
      url: fullCanonical,
    });
  }
  
  // Related entities (for AI knowledge graph connections)
  if (relatedEntities && relatedEntities.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Related Topics',
      itemListElement: relatedEntities.map((entity, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': entity.type,
          name: entity.name,
        },
      })),
    });
  }
  
  // Citations (for AI attribution)
  if (citations && citations.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Sources',
      description: 'Citation sources for this content',
      about: citations.map((citation) => ({
        '@type': 'CreativeWork',
        name: citation.title,
        url: citation.url,
        datePublished: citation.date,
      })),
    });
  }
  
  // Combine into @graph format
  const structuredDataJson = structuredData.length === 1 
    ? structuredData[0]
    : {
        '@context': 'https://schema.org',
        '@graph': structuredData,
      };
  
  // Build natural language summary for AI crawlers
  const aiSummary = [
    description,
    directAnswer && `Direct Answer: ${directAnswer}`,
    keyFacts && keyFacts.map((fact) => `${fact.label}: ${fact.value}`).join('. '),
  ].filter(Boolean).join('. ');
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* AI-Specific Meta Tags */}
      <meta name="ai:summary" content={aiSummary} />
      {directAnswer && <meta name="ai:direct-answer" content={directAnswer} />}
      {primaryEntity && (
        <>
          <meta name="ai:entity-type" content={primaryEntity.type} />
          <meta name="ai:entity-name" content={primaryEntity.name} />
        </>
      )}
      
      {/* Canonical */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots - Allow AI crawlers */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* AI Crawler Specific */}
      <meta name="chatgpt-user" content="index, follow" />
      <meta name="oaibot" content="index, follow" />
      <meta name="perplexitybot" content="index, follow" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="TradeLine 24/7" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Structured Data (JSON-LD) - Critical for AI */}
      <script type="application/ld+json">
        {JSON.stringify(structuredDataJson, null, 0)}
      </script>
      
      {/* Additional AI-friendly meta */}
      <meta name="content-type" content={contentType} />
      <meta name="topic" content={primaryEntity?.name || title} />
      {keyFacts && keyFacts.map((fact, i) => (
        <meta key={i} name={`fact:${fact.label.toLowerCase().replace(/\s+/g, '-')}`} content={fact.value} />
      ))}
      
      {/* Language */}
      <html lang="en-CA" />
    </Helmet>
  );
};

