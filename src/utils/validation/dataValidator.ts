// src/utils/validation/dataValidator.ts
// Data validation utilities to prevent errors from malformed data

import { handleError, ErrorSeverity } from '@/utils/errorHandling';

export interface ValidationRule<T> {
  test: (value: any) => boolean;
  message: string;
  fix?: (value: any) => T;
}

export interface ValidationOptions {
  throwOnError?: boolean;
  fixInvalid?: boolean;
  errorContext?: {
    module?: string;
    component?: string;
    operation?: string;
  };
}

/**
 * Validate data against a set of rules
 */
export function validate<T>(
  value: any,
  rules: ValidationRule<T>[],
  options: ValidationOptions = {}
): { isValid: boolean; value: T; errors: string[] } {
  const { throwOnError = false, fixInvalid = true, errorContext } = options;
  const errors: string[] = [];
  let isValid = true;
  let validatedValue = value;

  // Apply each rule in sequence
  for (const rule of rules) {
    const passes = rule.test(validatedValue);
    
    if (!passes) {
      isValid = false;
      errors.push(rule.message);
      
      // Apply fix if available and fixInvalid is enabled
      if (fixInvalid && rule.fix) {
        validatedValue = rule.fix(validatedValue);
      }
    }
  }

  // Handle error if validation fails and throwOnError is enabled
  if (!isValid && throwOnError) {
    const errorMessage = errors.join('; ');
    throw handleError(
      new Error(errorMessage),
      {
        module: errorContext?.module || 'DataValidator',
        component: errorContext?.component,
        operation: errorContext?.operation || 'validate',
        data: { originalValue: value, validatedValue, errors }
      },
      ErrorSeverity.WARNING,
      false
    );
  }

  return {
    isValid,
    value: validatedValue as T,
    errors
  };
}

/**
 * Common validation rules
 */
export const rules = {
  // Type validation
  isString: {
    test: (value: any) => typeof value === 'string',
    message: 'Value must be a string',
    fix: (value: any) => String(value)
  },
  
  isNumber: {
    test: (value: any) => typeof value === 'number' && !isNaN(value),
    message: 'Value must be a number',
    fix: (value: any) => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    }
  },
  
  isBoolean: {
    test: (value: any) => typeof value === 'boolean',
    message: 'Value must be a boolean',
    fix: (value: any) => Boolean(value)
  },
  
  isArray: {
    test: (value: any) => Array.isArray(value),
    message: 'Value must be an array',
    fix: (value: any) => Array.isArray(value) ? value : []
  },
  
  isObject: {
    test: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),
    message: 'Value must be an object',
    fix: (value: any) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value;
      }
      return {};
    }
  },
  
  // Value validation
  notEmpty: {
    test: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== null && value !== undefined;
    },
    message: 'Value cannot be empty',
    fix: (value: any) => {
      if (typeof value === 'string') return value || '';
      if (Array.isArray(value)) return value.length ? value : [];
      if (typeof value === 'object' && value !== null) return value || {};
      return value || null;
    }
  },
  
  minLength: (min: number) => ({
    test: (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length >= min;
      }
      return false;
    },
    message: `Value must be at least ${min} characters/items long`,
    fix: (value: any) => {
      if (typeof value === 'string') {
        return value.padEnd(min, ' ');
      }
      if (Array.isArray(value)) {
        if (value.length >= min) return value;
        return [...value, ...Array(min - value.length).fill(null)];
      }
      return value;
    }
  }),
  
  maxLength: (max: number) => ({
    test: (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length <= max;
      }
      return false;
    },
    message: `Value must not exceed ${max} characters/items`,
    fix: (value: any) => {
      if (typeof value === 'string') {
        return value.slice(0, max);
      }
      if (Array.isArray(value)) {
        return value.slice(0, max);
      }
      return value;
    }
  }),
  
  minValue: (min: number) => ({
    test: (value: any) => {
      const num = Number(value);
      return !isNaN(num) && num >= min;
    },
    message: `Value must be at least ${min}`,
    fix: (value: any) => {
      const num = Number(value);
      return isNaN(num) ? min : Math.max(num, min);
    }
  }),
  
  maxValue: (max: number) => ({
    test: (value: any) => {
      const num = Number(value);
      return !isNaN(num) && num <= max;
    },
    message: `Value must not exceed ${max}`,
    fix: (value: any) => {
      const num = Number(value);
      return isNaN(num) ? max : Math.min(num, max);
    }
  }),
  
  isEmail: {
    test: (value: any) => {
      if (typeof value !== 'string') return false;
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: 'Value must be a valid email address',
    fix: (value: any) => {
      return typeof value === 'string' ? value : '';
    }
  },
  
  isUrl: {
    test: (value: any) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Value must be a valid URL',
    fix: (value: any) => {
      if (typeof value !== 'string') return '';
      
      // Try to fix URLs missing the protocol
      if (value && !value.includes('://')) {
        return `https://${value}`;
      }
      
      return value;
    }
  },
  
  // Structure validation for objects and arrays
  hasProperty: (prop: string) => ({
    test: (value: any) => {
      return typeof value === 'object' && value !== null && prop in value;
    },
    message: `Object must have property '${prop}'`,
    fix: (value: any) => {
      if (typeof value !== 'object' || value === null) {
        return { [prop]: null };
      }
      
      return {
        ...value,
        [prop]: value[prop] || null
      };
    }
  }),
  
  // JSON validation
  isValidJson: {
    test: (value: any) => {
      if (typeof value !== 'string') return false;
      
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Value must be valid JSON',
    fix: (value: any) => {
      if (typeof value !== 'string') return '{}';
      
      try {
        JSON.parse(value);
        return value;
      } catch {
        return '{}';
      }
    }
  }
};

/**
 * Validate that an object has the expected properties and types
 */
export function validateObjectShape(
  obj: any,
  shape: Record<string, ValidationRule<any>[]>,
  options: ValidationOptions = {}
): { isValid: boolean; value: Record<string, any>; errors: Record<string, string[]> } {
  const result: Record<string, any> = { ...obj };
  const errors: Record<string, string[]> = {};
  let isValid = true;

  // Process each property in the shape
  for (const [prop, propRules] of Object.entries(shape)) {
    const propValue = obj?.[prop];
    const propResult = validate(propValue, propRules, {
      ...options,
      throwOnError: false,
      errorContext: {
        ...options.errorContext,
        operation: `validate.${prop}`
      }
    });

    // Store validation results
    result[prop] = propResult.value;
    
    if (!propResult.isValid) {
      isValid = false;
      errors[prop] = propResult.errors;
    }
  }

  // Handle error if validation fails and throwOnError is enabled
  if (!isValid && options.throwOnError) {
    const errorMessage = Object.entries(errors)
      .map(([prop, propErrors]) => `${prop}: ${propErrors.join(', ')}`)
      .join('; ');
    
    throw handleError(
      new Error(errorMessage),
      {
        module: options.errorContext?.module || 'DataValidator',
        component: options.errorContext?.component,
        operation: options.errorContext?.operation || 'validateObjectShape',
        data: { originalValue: obj, validatedValue: result, errors }
      },
      ErrorSeverity.WARNING,
      false
    );
  }

  return {
    isValid,
    value: result,
    errors
  };
}

/**
 * Parse and validate JSON data in one step
 */
export function parseAndValidate<T>(
  jsonString: string,
  rules: ValidationRule<T>[],
  options: ValidationOptions = {}
): { isValid: boolean; value: T; errors: string[] } {
  try {
    // Parse the JSON
    const parsed = JSON.parse(jsonString);
    
    // Validate the parsed data
    return validate<T>(parsed, rules, options);
  } catch (error) {
    // Handle JSON parsing errors
    const parseError = 'Invalid JSON format';
    
    if (options.throwOnError) {
      throw handleError(error, {
        module: options.errorContext?.module || 'DataValidator',
        component: options.errorContext?.component,
        operation: options.errorContext?.operation || 'parseAndValidate',
        data: { jsonString }
      }, ErrorSeverity.WARNING, false);
    }
    
    // Return a validation error result
    return {
      isValid: false,
      value: (options.fixInvalid && rules[0]?.fix ? rules[0].fix({}) : {}) as T,
      errors: [parseError]
    };
  }
}

/**
 * Simple type-checking utility with fallback
 */
export function ensureType<T>(value: any, type: 'string' | 'number' | 'boolean' | 'object' | 'array', fallback: T): T {
  if (type === 'array' && Array.isArray(value)) return value as unknown as T;
  if (type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) return value as T;
  if (typeof value === type) return value as unknown as T;
  return fallback;
}

/**
 * Utility to clean objects by removing undefined, null, and empty string values
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    // Skip undefined, null, and empty strings
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    
    // Recursively clean nested objects
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const cleaned = cleanObject(value);
      
      // Only add if the cleaned object has properties
      if (Object.keys(cleaned).length > 0) {
        acc[key as keyof T] = cleaned as any;
      }
      return acc;
    }
    
    // Clean arrays of objects recursively
    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => typeof item === 'object' && item !== null ? cleanObject(item) : item)
        .filter(item => {
          if (typeof item === 'object' && item !== null) {
            return Object.keys(item).length > 0;
          }
          return item !== undefined && item !== null && item !== '';
        });
      
      // Only add if the cleaned array has items
      if (cleaned.length > 0) {
        acc[key as keyof T] = cleaned as any;
      }
      return acc;
    }
    
    // Add other values as is
    acc[key as keyof T] = value;
    return acc;
  }, {} as Partial<T>);
}
