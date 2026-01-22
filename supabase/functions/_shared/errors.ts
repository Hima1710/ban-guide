/**
 * Error handling utilities for Supabase Edge Functions
 */

import { corsResponse } from './cors'

/**
 * Standard API error response
 */
export interface ApiError {
  success: false
  error: string
  code?: string
}

/**
 * Standard API success response
 */
export interface ApiSuccess<T = any> {
  success: true
  data: T
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
): Response {
  return corsResponse(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    status
  )
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): Response {
  return corsResponse(
    {
      success: true,
      data,
    },
    status
  )
}

/**
 * Handle async function errors
 */
export function handleFunctionError(error: any): Response {
  console.error('Function error:', error)
  
  const message = error?.message || 'حدث خطأ غير متوقع'
  const status = error?.status || 500
  const code = error?.code

  return errorResponse(message, status, code)
}
