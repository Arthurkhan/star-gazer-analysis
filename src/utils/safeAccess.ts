// src/utils/safeAccess.ts
// Utility functions for safely accessing potentially undefined data

/**
 * Safely access a nested property in an object
 * @param obj The object to access
 * @param path The path to the property, using dot notation
 * @param defaultValue The default value to return if the property doesn't exist
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  const properties = path.split('.');
  let current = obj;
  
  for (const property of properties) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    
    current = current[property];
  }
  
  return current !== undefined && current !== null ? current as T : defaultValue;
}

/**
 * Safely access an array element
 * @param arr The array to access
 * @param index The index to access
 * @param defaultValue The default value to return if the element doesn't exist
 */
export function safeArrayGet<T>(arr: T[] | null | undefined, index: number, defaultValue: T): T {
  if (!arr || !Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  
  return arr[index] ?? defaultValue;
}

/**
 * Safely call a function, returning a default value if the function throws
 * @param fn The function to call
 * @param defaultValue The default value to return if the function throws
 * @param args The arguments to pass to the function
 */
export function safeCall<T>(fn: (...args: any[]) => T, defaultValue: T, ...args: any[]): T {
  try {
    return fn(...args);
  } catch (error) {
    console.error('Error in safeCall:', error);
    return defaultValue;
  }
}

/**
 * Safely parse JSON, returning a default value if parsing fails
 * @param json The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 */
export function safeParseJSON<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely access a property in localStorage, with optional parsing
 * @param key The localStorage key
 * @param defaultValue The default value to return if the key doesn't exist
 * @param parse Whether to parse the value as JSON
 */
export function safeLocalStorage<T>(key: string, defaultValue: T, parse = false): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return parse ? JSON.parse(value) as T : value as unknown as T;
  } catch (error) {
    console.error(`Error accessing localStorage key "${key}":`, error);
    return defaultValue;
  }
}
