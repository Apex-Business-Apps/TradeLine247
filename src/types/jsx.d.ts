import type { ImgHTMLAttributes as ReactImgHTMLAttributes } from 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: 'auto' | 'high' | 'low';
  }
}

declare global {
  namespace JSX {
    interface ImgHTMLAttributes<T> extends ReactImgHTMLAttributes<T> {
      fetchpriority?: 'auto' | 'high' | 'low';
    }
  }
}

export {};
