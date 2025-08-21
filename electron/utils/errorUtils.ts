export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export const createSuccessResult = <T>(data?: T): ServiceResult<T> => ({
  success: true,
  data,
})

export const createErrorResult = (error: Error | string): ServiceResult => ({
  success: false,
  error: error instanceof Error ? error.message : error,
})

export const wrapAsync = async <T>(
  fn: () => Promise<T>
): Promise<ServiceResult<T>> => {
  try {
    const data = await fn()
    return createSuccessResult(data)
  } catch (error) {
    return createErrorResult(error instanceof Error ? error : new Error(String(error)))
  }
}