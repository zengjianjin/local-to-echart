export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${context}] ${message}`)
  return message
}

export function logWarning(context: string, message: string) {
  console.error(`[${context}] ${message}`)
}
