// UPS Tracking API Service
// Docs: https://developer.ups.com/api/reference
// Requires: UPS_API_KEY environment variable

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

const UPS_BASE_URL = 'https://onlinetools.ups.com/api'

const UPS_STATUS_MAP: Record<string, string> = {
  'P': 'Pickup',
  'I': 'In Transit',
  'O': 'Out for Delivery',
  'D': 'Delivered',
  'X': 'Exception',
  'M': 'Manifest',
}

export async function trackUPSPackage(trackingNumber: string): Promise<TrackingResult> {
  if (!process.env.UPS_API_KEY) {
    console.log(`[UPS] Tracking ${trackingNumber} — API key not configured, returning mock data`)
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      statusDescription: 'Package in transit (mock)',
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
      location: 'Louisville, KY',
      events: [
        {
          timestamp: new Date().toISOString(),
          description: 'Package in transit',
          location: 'Louisville, KY',
        },
      ],
    }
  }

  const response = await fetch(
    `${UPS_BASE_URL}/track/v1/details/${trackingNumber}?locale=en_US&returnMilestones=true&returnPOD=false`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.UPS_API_KEY}`,
        'Content-Type': 'application/json',
        'transId': `WMS-${Date.now()}`,
        'transactionSrc': 'STC-WMS',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`UPS tracking request failed: ${response.statusText}`)
  }

  const data = await response.json()
  const shipment = data.trackResponse?.shipment?.[0]

  if (!shipment) {
    throw new Error('No tracking results returned from UPS')
  }

  const pkg = shipment.package?.[0]
  const activity = pkg?.activity || []
  const latestActivity = activity[0]

  const statusCode = latestActivity?.status?.type || ''

  return {
    trackingNumber,
    status: UPS_STATUS_MAP[statusCode] || statusCode,
    statusDescription: latestActivity?.status?.description || '',
    estimatedDelivery: pkg?.deliveryTime?.endTime,
    actualDelivery: pkg?.deliveryTime?.endTime,
    location: latestActivity?.location?.address?.city,
    events: activity.map((a: { date?: string; time?: string; status?: { description?: string }; location?: { address?: { city?: string; stateProvince?: string } } }) => ({
      timestamp: `${a.date || ''} ${a.time || ''}`.trim(),
      description: a.status?.description || '',
      location: [a.location?.address?.city, a.location?.address?.stateProvince].filter(Boolean).join(', '),
    })),
  }
}

export async function trackMultipleUPS(trackingNumbers: string[]): Promise<TrackingResult[]> {
  return Promise.allSettled(trackingNumbers.map(trackUPSPackage)).then(results =>
    results
      .filter((r): r is PromiseFulfilledResult<TrackingResult> => r.status === 'fulfilled')
      .map(r => r.value)
  )
}
