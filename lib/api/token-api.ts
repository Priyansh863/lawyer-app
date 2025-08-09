import axios from 'axios'

// API_BASE_URL already includes /api/v1, so we don't need to add it again
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Types
export interface TokenBalance {
  current_balance: number
  total_purchased: number
  total_used: number
  monthly_usage: number
  last_monthly_reset: string
}

export interface TokenTransaction {
  _id: string
  user_id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  description: string
  category: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  stripe_payment_intent_id?: string
  stripe_session_id?: string
  package_id?: string
  package_name?: string
  created_at: string
  updated_at: string
}

export interface TokenStats {
  current_balance: number
  total_purchased: number
  monthly_usage: number
  usage_by_category: Record<string, number>
  recent_transactions: TokenTransaction[]
}

export interface PaymentSession {
  sessionId: string
  status: string
  paymentStatus: string
  amountTotal: number
  currency: string
  customerEmail: string
  metadata: Record<string, any>
  transaction?: TokenTransaction
  tokenBalance?: TokenBalance
}

// Get auth headers with token
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
})

// Get user's current token balance
export async function getTokenBalance(token: string): Promise<TokenBalance> {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/tokens`, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error fetching token balance:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch token balance')
  }
}

// Get user's token transaction history
export async function getTokenTransactions(token: string, page = 1, limit = 20, type?: string): Promise<{
  transactions: TokenTransaction[]
  pagination: {
    currentPage: number
    totalPages: number
    totalTransactions: number
    hasNext: boolean
    hasPrev: boolean
  }
}> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (type) {
      params.append('type', type)
    }

    const response = await axios.get(`${API_BASE_URL}/user/token-transactions?${params}`, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error fetching token transactions:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch token transactions')
  }
}

// Get token usage statistics
export async function getTokenStats(token: string): Promise<TokenStats> {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/token-stats`, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error fetching token stats:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch token stats')
  }
}

// Create Stripe checkout session for token purchase
export async function createCheckoutSession(token: string, packageId: string): Promise<{ url: string; sessionId: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/stripe/create-checkout-session`, {
      packageId
    }, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    throw new Error(error.response?.data?.message || 'Failed to create checkout session')
  }
}

// Verify payment session and get status
export async function verifyPaymentSession(token: string, sessionId: string): Promise<PaymentSession> {
  try {
    const response = await axios.get(`${API_BASE_URL}/stripe/verify-session/${sessionId}`, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error verifying payment session:', error)
    throw new Error(error.response?.data?.message || 'Failed to verify payment session')
  }
}

// Use tokens for AI operations
export async function useTokens(token: string, amount: number, category: string, description: string): Promise<TokenBalance> {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/use-tokens`, {
      amount,
      category,
      description
    }, {
      headers: getAuthHeaders(token)
    })
    return response.data.data
  } catch (error: any) {
    console.error('Error using tokens:', error)
    throw new Error(error.response?.data?.message || 'Failed to use tokens')
  }
}

// Export token transactions as CSV
export async function exportTokenTransactions(): Promise<Blob> {
  try {
    const { transactions } = await getTokenTransactions(1, 1000) // Get all transactions
    
    const csvContent = [
      'Date,Type,Amount,Description,Status,Package',
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.amount,
        t.description,
        t.status,
        t.package_name || ''
      ].join(','))
    ].join('\n')
    
    return new Blob([csvContent], { type: 'text/csv' })
  } catch (error: any) {
    console.error('Error exporting transactions:', error)
    throw new Error('Failed to export transactions')
  }
}
