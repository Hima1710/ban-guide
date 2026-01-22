/**
 * CORS headers for Supabase Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return new Response(null, {
    headers: corsHeaders,
  })
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
