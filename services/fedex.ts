// FedEx Tracking API Service
// Docs: https://developer.fedex.com/api/en-us/catalog/tracking/
// Requires: FEDEX_API_KEY environment variable

interface TrackingResult {
  trackingNumber: string
  status: string
  statusDescription: string
  estimatedDelivery?: string
  actualDelivery?: string
  location?: string
  events: Array<{
    timestamp: string
    description: string
    location: string
  }>
}

const FEDEX_BASE_URL = 'https://apis.fedex.com'

// Status code mapping from FedEx to WMS display
const FEDEX_STATUS_MAP: Record<string, string> = {
  'OC': 'Order Created',
  'PU': 'Picked Up',
  'IT': 'In Transit',
  'OD': 'Out for Delivery',
  'DL': 'Delivered',
  'DE': 'Delivery Exception',
  'RS': 'Return to Sender',
  'HD': 'Held at Location',
}

async function getFedExOAuthToken(): Promise<string> {
  if (!process.env.FEDEX_API_KEY) {
    throw new Error('FEDEX_API_KEY not configured')
  }

  const response = await fetch(`${FEDEX_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_API_KEY,
      client_secret: process.env.FEDEX_API_SECRET || '',
    }),
  })

  if (!response.ok) {
    throw new Error(`FedEx OAuth failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function trackFedExPackage(trackingNumber: string): Promise<TrackingResult> {
  // Return mock data when API key not configured (development)
  if (!process.env.FEDEX_API_KEY) {
    console.log(`[FedEx] Tracking ${trackingNumber} — API key not configured, returning mock data`)
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      statusDescription: 'Package in transit (mock)',
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
      location: 'Memphis, TN',
      events: [
        {
          timestamp: new Date().toISOString(),
          description: 'Package in transit',
          location: 'Memphis, TN',
        },
      ],
    }
  }

  const token = await getFedExOAuthToken()

  const response = await fetch(`${FEDEX_BASE_URL}/track/v1/trackingnumbers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    }),
  })

  if (!response.ok) {
    throw new Error(`FedEx tracking request failed: ${response.statusText}`)
  }

  const data = await response.json()
  const trackResult = data.output?.completeTrackResults?.[0]?.trackResults?.[0]

  if (!trackResult) {
    throw new Error('No tracking results returned')
  }

  const statusCode = trackResult.latestStatusDetail?.code || ''
  const events = (trackResult.dateAndTimes || []).map((event: { type: string; dateTime: string }) => ({
    timestamp: event.dateTime,
    description: event.type,
    location: '',
  }))

  return {
    trackingNumber,
    status: FEDEX_STATUS_MAP[statusCode] || statusCode,
    statusDescription: trackResult.latestStatusDetail?.description || '',
    estimatedDelivery: trackResult.estimatedDeliveryTimeWindow?.window?.ends,
    actualDelivery: trackResult.actualDeliveryTime,
    location: trackResult.latestStatusDetail?.scanLocation?.city,
    events,
  }
}

export async function trackMultipleFedEx(trackingNumbers: string[]): Promise<TrackingResult[]> {
  return Promise.allSettled(trackingNumbers.map(trackFedExPackage)).then(results =>
    results
      .filter((r): r is PromiseFulfilledResult<TrackingResult> => r.status === 'fulfilled')
      .map(r => r.value)
  )
}
