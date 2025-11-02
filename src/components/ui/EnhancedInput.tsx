/**
 * Enhanced Input Component with Inline Validation & Contextual Help
 * Design Thinking: Progressive disclosure, immediate feedback, contextual help
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  showStrength?: boolean;
  success?: boolean;
  required?: boolean;
  onValidate?: (value: string) => string | undefined;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  hint,
  showStrength = false,
  success = false,
  required = false,
  onValidate,
  className,
  type = 'text',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [internalError, setInternalError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasError = error || internalError;
  const showError = (isTouched || isFocused) && hasError;
  const isValid = success || (!hasError && props.value && validationState === 'valid');

  useEffect(() => {
    if (onValidate && props.value) {
      const validation = onValidate(props.value as string);
      if (validation) {
        setInternalError(validation);
        setValidationState('invalid');
      } else {
        setInternalError(undefined);
        setValidationState('valid');
      }
    }
  }, [props.value, onValidate]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setIsTouched(true);
    if (onValidate && e.target.value) {
      const validation = onValidate(e.target.value);
      if (validation) {
        setInternalError(validation);
      }
    }
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  return (
    <div className="space-y-1.5">
      {/* Label with Required Indicator */}
      <label 
        htmlFor={props.id}
        className={cn(
          "text-sm font-medium text-foreground flex items-center gap-1",
          required && "after:content-['*'] after:text-destructive after:ml-0.5"
        )}
      >
        {label}
        {hint && (
          <span className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
            <span className="absolute left-full top-0 ml-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {hint}
            </span>
          </span>
        )}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground",
            "placeholder:text-muted-foreground",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            showError 
              ? "border-destructive focus:ring-destructive focus:border-destructive" 
              : isValid
              ? "border-green-500 focus:ring-green-500 focus:border-green-500"
              : isFocused
              ? "border-primary focus:ring-primary focus:border-primary shadow-sm"
              : "border-input hover:border-primary/50",
            isPassword && "pr-10",
            className
          )}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={
            showError ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Validation Icons */}
        {isFocused || isTouched ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {showError ? (
              <AlertCircle className="w-5 h-5 text-destructive animate-in fade-in" />
            ) : isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 animate-in fade-in" />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {showError && (
        <p
          id={`${props.id}-error`}
          className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error || internalError}</span>
        </p>
      )}

      {/* Hint Message */}
      {!showError && hint && (isFocused || isTouched) && (
        <p
          id={`${props.id}-hint`}
          className="text-xs text-muted-foreground animate-in fade-in"
        >
          {hint}
        </p>
      )}

      {/* Success Message */}
      {isValid && !showError && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Looks good!</span>
        </p>
      )}
    </div>
  );
};

