// EDI 214 — Transportation Carrier Shipment Status Message
// Used for TMS handoff with airport code routing

interface ShipmentData {
  shipmentId: string
  orderId: string
  carrier?: string
  proNumber?: string
  status: string
  statusDate: Date
  airportCode?: string
  shipperName: string
  shipperAddress: string
  shipperCity: string
  shipperState: string
  shipperZip: string
  consigneeName: string
  consigneeAddress: string
  consigneeCity: string
  consigneeState: string
  consigneeZip: string
  items: Array<{
    skuCode: string
    description: string
    qty: number
    weight?: number
  }>
  totalWeight?: number
}

const STATUS_CODE_MAP: Record<string, string> = {
  PENDING_PICKUP: 'OA', // Order Accepted
  IN_TRANSIT: 'AF',     // Shipment In Transit
  DELIVERED: 'D1',      // Delivered
  EXCEPTION: 'X1',      // Exception
}

function formatEDIDate(date: Date): string {
  return date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 8)
}

function formatEDITime(date: Date): string {
  return date.toISOString().replace(/[-:T.Z]/g, '').slice(8, 12)
}

function generateInterchangeControlNumber(): string {
  return String(Date.now()).slice(-9).padStart(9, '0')
}

export function generateEDI214(shipment: ShipmentData): string {
  const now = new Date()
  const icn = generateInterchangeControlNumber()
  const gcn = icn.slice(-4)
  const date = formatEDIDate(now)
  const time = formatEDITime(now)
  const statusCode = STATUS_CODE_MAP[shipment.status] || 'AF'
  const shipDate = formatEDIDate(shipment.statusDate)

  const segments: string[] = [
    // ISA - Interchange Control Header
    `ISA*00*          *00*          *ZZ*SHIPSTC        *ZZ*PARTNER        *${date.slice(2)}*${time}*U*00401*${icn}*0*P*>`,
    // GS - Functional Group Header
    `GS*QM*SHIPSTC*PARTNER*${date}*${time}*${gcn}*X*004010`,
    // ST - Transaction Set Header
    `ST*214*0001`,
    // B10 - Beginning Segment for Transportation Carrier Shipment Status
    `B10*${shipment.proNumber || icn}*${shipment.orderId}*${shipment.carrier || 'UNKN'}`,
    // L11 - Business Instructions and Reference Number
    `L11*${shipment.shipmentId}*SID`,
    ...(shipment.airportCode ? [`L11*${shipment.airportCode}*ZZ`] : []),
    // MS3 - Interline Information
    `MS3*${shipment.carrier || 'UNKN'}*D*${shipment.shipperState}`,
    // AT7 - Shipment Status Details
    `AT7*${statusCode}*NS**${shipDate}*${time}*LT`,
    // MS1 - Equipment, Shipment, or Real Property Location
    `MS1*${shipment.consigneeCity}*${shipment.consigneeState}*${shipment.consigneeZip}`,
    // N1 - Name (Shipper)
    `N1*SH*${shipment.shipperName}`,
    `N3*${shipment.shipperAddress}`,
    `N4*${shipment.shipperCity}*${shipment.shipperState}*${shipment.shipperZip}`,
    // N1 - Name (Consignee)
    `N1*CN*${shipment.consigneeName}`,
    `N3*${shipment.consigneeAddress}`,
    `N4*${shipment.consigneeCity}*${shipment.consigneeState}*${shipment.consigneeZip}`,
    // LX - loop for each item
    ...shipment.items.flatMap((item, i) => [
      `LX*${i + 1}`,
      `AT8*G*L*${item.weight || 0}*${item.qty}`,
      `L11*${item.skuCode}*PO`,
    ]),
    // SE - Transaction Set Trailer
    `SE*${13 + shipment.items.length * 3}*0001`,
    // GE - Functional Group Trailer
    `GE*1*${gcn}`,
    // IEA - Interchange Control Trailer
    `IEA*1*${icn}`,
  ]

  return segments.join('\n')
}

export function exportShipmentEDI214(shipment: ShipmentData): { content: string; filename: string } {
  const content = generateEDI214(shipment)
  const filename = `EDI214_${shipment.shipmentId}_${formatEDIDate(new Date())}.edi`
  return { content, filename }
}
