/**
 * AI Content Block Component
 * 
 * Optimizes content structure for AI search engines:
 * - Natural language format
 * - Clear question-answer structure
 * - Factual statements
 * - Entity recognition
 * - Citation-ready content
 * 
 * Target: AI SEO >95
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface AIContentBlockProps {
  /**
   * Question or heading
   */
  question?: string;
  /**
   * Direct answer (AI citation-ready)
   */
  answer: string;
  /**
   * Key facts/statistics
   */
  facts?: Array<{
    label: string;
    value: string;
  }>;
  /**
   * Additional context
   */
  context?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Semantic HTML level
   * @default 'section'
   */
  as?: 'section' | 'article' | 'div';
}

/**
 * AI Content Block Component
 * 
 * Structured for AI readability and citation
 */
export const AIContentBlock: React.FC<AIContentBlockProps> = ({
  question,
  answer,
  facts,
  context,
  className,
  as: Component = 'section',
}) => {
  return (
    <Component
      className={cn('space-y-4', className)}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {question && (
        <h2 className="text-2xl font-semibold" itemProp="name">
          {question}
        </h2>
      )}
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
          <span itemProp="text">{answer}</span>
        </p>
        
        {context && (
          <p className="text-muted-foreground mt-4">
            {context}
          </p>
        )}
      </div>
      
      {facts && facts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg bg-muted/30"
              itemScope
              itemType="https://schema.org/QuantitativeValue"
            >
              <div className="text-sm font-medium text-muted-foreground" itemProp="name">
                {fact.label}
              </div>
              <div className="text-2xl font-bold mt-1" itemProp="value">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </Component>
  );
};

/**
 * AI Fact List Component
 * For displaying key facts in AI-friendly format
 */
export interface AIFactListProps {
  facts: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  className?: string;
}

export const AIFactList: React.FC<AIFactListProps> = ({ facts, className }) => {
  return (
    <div className={cn('space-y-3', className)} itemScope itemType="https://schema.org/ItemList">
      {facts.map((fact, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
          itemScope
          itemType="https://schema.org/ListItem"
          itemProp="itemListElement"
        >
          <div className="flex-1">
            <div className="font-medium" itemProp="name">
              {fact.label}
            </div>
            {fact.description && (
              <div className="text-sm text-muted-foreground mt-1" itemProp="description">
                {fact.description}
              </div>
            )}
          </div>
          <div className="font-semibold text-lg" itemProp="value">
            {fact.value}
          </div>
        </div>
      ))}
    </div>
  );
};

