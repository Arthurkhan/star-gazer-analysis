// Test file to verify ESLint setup
export function testFunction(): string {
  return 'ESLint is working correctly!'
}

export const testObject = {
  message: 'Linting configuration is fixed',
  timestamp: new Date().toISOString(),
}

// This should not trigger any lint errors
export default testFunction
