/**
 * Utilities for safely accessing potentially undefined data
 * This helps prevent "Cannot read properties of undefined" errors
 */

/**
 * Safely get a nested property from an object
 * @param obj The object to access
 * @param path The property path, e.g. 'user.profile.name'
 * @param defaultValue Default value if the path doesn't exist
 * @returns The value at the path or the default value
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || !path) {
    return defaultValue
  }

  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue
    }
    result = result[key]
  }

  return (result === undefined || result === null) ? defaultValue : result
}

/**
 * Safely access an array element
 * @param arr The array to access
 * @param index The index to access
 * @param defaultValue Default value if the index doesn't exist
 * @returns The value at the index or the default value
 */
export function safeArrayGet<T>(arr: T[] | null | undefined, index: number, defaultValue: T): T {
  if (!arr || index < 0 || index >= arr.length) {
    return defaultValue
  }
  return arr[index]
}

/**
 * Safely call a function that might not exist
 * @param fn The function to call
 * @param args Arguments to pass to the function
 * @param defaultValue Default value if the function doesn't exist or throws
 * @returns The function result or the default value
 */
export function safeCall<T>(fn: Function | null | undefined, args: any[], defaultValue: T): T {
  if (!fn || typeof fn !== 'function') {
    return defaultValue
  }

  try {
    return fn(...args)
  } catch (error) {
    console.error('Error in safeCall:', error)
    return defaultValue
  }
}

/**
 * Convert a value to a number safely
 * @param value The value to convert
 * @param defaultValue Default value if conversion fails
 * @returns The number or the default value
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * Convert a value to a string safely
 * @param value The value to convert
 * @param defaultValue Default value if conversion fails
 * @returns The string or the default value
 */
export function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue
  }

  try {
    return String(value)
  } catch (error) {
    return defaultValue
  }
}

/**
 * Parse JSON safely
 * @param jsonString The JSON string to parse
 * @param defaultValue Default value if parsing fails
 * @returns The parsed object or the default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return defaultValue
  }
}
