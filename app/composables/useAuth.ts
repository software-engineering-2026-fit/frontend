const TOKEN_STORAGE_KEY = 'fit_access_token'

export interface User {
  id: string
  email: string
  name: string
}

interface AccessToken {
  access_token: string
  token_type: string
}

export class ApiRequestError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.email === 'string'
    && typeof value.name === 'string'
  )
}

function isAccessToken(value: unknown): value is AccessToken {
  return (
    isRecord(value)
    && typeof value.access_token === 'string'
    && value.access_token.length > 0
    && typeof value.token_type === 'string'
    && value.token_type.toLowerCase() === 'bearer'
  )
}

export async function requestApi(
  apiBaseUrl: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, init)
  } catch (error) {
    throw new Error(
      `Could not connect to ${apiBaseUrl}. Make sure the API is running and allows this frontend origin.`,
      { cause: error }
    )
  }

  let result: unknown
  try {
    result = await response.json()
  } catch {
    result = null
  }

  if (!response.ok) {
    const message = isRecord(result) && typeof result.detail === 'string'
      ? result.detail
      : response.status === 401
        ? 'Email or password is incorrect.'
        : `The API request failed (${response.status}).`
    throw new ApiRequestError(response.status, message)
  }

  return result
}

async function fetchCurrentUser(token: string, apiBaseUrl: string): Promise<User> {
  const result = await requestApi(apiBaseUrl, '/auth/me', {
    headers: { authorization: `Bearer ${token}` }
  })

  if (!isUser(result)) {
    throw new Error('The API returned an invalid user profile.')
  }

  return result
}

export function useAuth() {
  const apiBaseUrl = useRuntimeConfig().public.apiBaseUrl
  const user = useState<User | null>('auth-user', () => null)
  const isInitialized = useState('auth-initialized', () => false)
  const isInitializing = useState('auth-initializing', () => false)
  const isSigningIn = useState('auth-signing-in', () => false)
  const isRegistering = useState('auth-registering', () => false)
  const errorMessage = useState<string | null>('auth-error', () => null)

  function getToken(): string | null {
    if (!import.meta.client) {
      return null
    }

    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  }

  async function initialize() {
    if (!import.meta.client || isInitialized.value || isInitializing.value) {
      return
    }

    isInitializing.value = true
    errorMessage.value = null

    try {
      const token = getToken()
      if (token) {
        user.value = await fetchCurrentUser(token, apiBaseUrl)
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.statusCode === 401) {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
        user.value = null
      } else {
        errorMessage.value = messageFrom(error)
      }
    } finally {
      isInitialized.value = true
      isInitializing.value = false
    }
  }

  async function signIn(email: string, password: string) {
    isSigningIn.value = true
    errorMessage.value = null

    try {
      const form = new URLSearchParams({
        username: email.trim(),
        password
      })
      const token = await requestApi(apiBaseUrl, '/auth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form
      })

      if (!isAccessToken(token)) {
        throw new Error('The API returned an invalid access token.')
      }

      const signedInUser = await fetchCurrentUser(token.access_token, apiBaseUrl)
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token.access_token)
      user.value = signedInUser
      isInitialized.value = true
      return true
    } catch (error) {
      errorMessage.value = messageFrom(error)
      return false
    } finally {
      isSigningIn.value = false
    }
  }

  async function register(name: string, email: string, password: string) {
    isRegistering.value = true
    errorMessage.value = null

    try {
      const result = await requestApi(apiBaseUrl, '/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password
        })
      })

      if (!isUser(result)) {
        throw new Error('The API returned an invalid account profile.')
      }

      return await signIn(email, password)
    } catch (error) {
      errorMessage.value = messageFrom(error)
      return false
    } finally {
      isRegistering.value = false
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    user.value = null
    errorMessage.value = null
  }

  return {
    user,
    isInitialized,
    isInitializing,
    isSigningIn,
    isRegistering,
    errorMessage,
    getToken,
    initialize,
    signIn,
    register,
    signOut
  }
}

export function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'The API returned an unexpected response. Please try again.'
}
