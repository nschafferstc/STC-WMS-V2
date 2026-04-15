import { PrismaClient, UserRole, ASNStatus, ReceiptStatus, OrderStatus, LoadType, ShipmentStatus, PackageStatus, DiscrepancyStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── System Settings ────────────────────────────────────────────
  await prisma.systemSetting.upsert({ where: { key: 'dim_factor_global' }, update: {}, create: { key: 'dim_factor_global', value: '194', description: 'Global dim weight factor (L×W×H ÷ factor)' } })
  await prisma.systemSetting.upsert({ where: { key: 'aging_threshold_days' }, update: {}, create: { key: 'aging_threshold_days', value: '90', description: 'Days before inventory flagged as aging' } })
  await prisma.systemSetting.upsert({ where: { key: 'order_prefix' }, update: {}, create: { key: 'order_prefix', value: 'STC-ORD', description: 'Order code prefix' } })
  await prisma.systemSetting.upsert({ where: { key: 'smtp_from' }, update: {}, create: { key: 'smtp_from', value: 'wms@stclogistics.com', description: 'SMTP from address' } })
  console.log('✓ System settings')

  // ── Warehouses ────────────────────────────────────────────────
  const wEWR = await prisma.warehouse.upsert({ where: { code: 'WH-EWR-01' }, update: {}, create: { code: 'WH-EWR-01', company_name: 'STC Logistics Newark', stc_reference_name: 'Newark / EWR', address: '100 Port Newark Blvd', city: 'Newark', state: 'NJ', zip: '07114' } })
  const wCMH = await prisma.warehouse.upsert({ where: { code: 'WH-CMH-01' }, update: {}, create: { code: 'WH-CMH-01', company_name: 'STC Logistics Columbus', stc_reference_name: 'Columbus / CMH', address: '3200 Toy Road', city: 'Groveport', state: 'OH', zip: '43125' } })
  const wDFW = await prisma.warehouse.upsert({ where: { code: 'WH-DFW-01' }, update: {}, create: { code: 'WH-DFW-01', company_name: 'STC Logistics Dallas', stc_reference_name: 'Dallas / DFW', address: '4800 Alliance Gateway Fwy', city: 'Fort Worth', state: 'TX', zip: '76177' } })
  const wLAX = await prisma.warehouse.upsert({ where: { code: 'WH-LAX-01' }, update: {}, create: { code: 'WH-LAX-01', company_name: 'STC Logistics Los Angeles', stc_reference_name: 'Los Angeles / LAX', address: '20000 S Alameda St', city: 'Carson', state: 'CA', zip: '90810' } })
  const wMEM = await prisma.warehouse.upsert({ where: { code: 'WH-MEM-01' }, update: {}, create: { code: 'WH-MEM-01', company_name: 'STC Logistics Memphis', stc_reference_name: 'Memphis / MEM', address: '4455 Transport Dr', city: 'Memphis', state: 'TN', zip: '38118' } })
  console.log('✓ Warehouses')

  // ── Clients ───────────────────────────────────────────────────
  const cCVS = await prisma.client.upsert({ where: { code: 'CL-CVS' }, update: {}, create: { code: 'CL-CVS', name: 'CVS Health' } })
  const cBAR = await prisma.client.upsert({ where: { code: 'CL-BAR' }, update: {}, create: { code: 'CL-BAR', name: 'Barrows' } })
  const cKOH = await prisma.client.upsert({ where: { code: 'CL-KOH' }, update: {}, create: { code: 'CL-KOH', name: 'Kohler' } })
  const cGME = await prisma.client.upsert({ where: { code: 'CL-GME' }, update: {}, create: { code: 'CL-GME', name: 'GameStop' } })
  console.log('✓ Clients')

  // ── Projects ──────────────────────────────────────────────────
  const pCVS = await prisma.project.upsert({ where: { code: 'PRJ-CVS-EB' }, update: {}, create: { code: 'PRJ-CVS-EB', name: 'CVS Energy Bar Display Program', client_id: cCVS.id, isRollout: false, aging_threshold_days: 90 } })
  const pBAR = await prisma.project.upsert({ where: { code: 'PRJ-BAR-KROG' }, update: {}, create: { code: 'PRJ-BAR-KROG', name: 'Barrows / Kroger Store Rollout', client_id: cBAR.id, isRollout: true, aging_threshold_days: 90 } })
  const pKOH = await prisma.project.upsert({ where: { code: 'PRJ-KOH-SAUNA' }, update: {}, create: { code: 'PRJ-KOH-SAUNA', name: 'Kohler Sauna Installation Project', client_id: cKOH.id, isRollout: false, aging_threshold_days: 120 } })
  console.log('✓ Projects')

  // ── Users ─────────────────────────────────────────────────────
  const pw = await bcrypt.hash('STC2024!', 12)
  await prisma.user.upsert({ where: { email: 'nschaffer@shipstc.com' }, update: { name: 'Nick Schaffer', passwordHash: pw, role: 'STC_EXECUTIVE' }, create: { name: 'Nick Schaffer', email: 'nschaffer@shipstc.com', passwordHash: pw, role: 'STC_EXECUTIVE' } })
  await prisma.user.upsert({ where: { email: 'rkohlmann@shipstc.com' }, update: { name: 'Rob Kohlmann', passwordHash: pw, role: 'STC_EXECUTIVE' }, create: { name: 'Rob Kohlmann', email: 'rkohlmann@shipstc.com', passwordHash: pw, role: 'STC_EXECUTIVE' } })
  await prisma.user.upsert({ where: { email: 'fferlito@shipstc.com' }, update: { name: 'Frank Ferlito', passwordHash: pw, role: 'STC_EXECUTIVE' }, create: { name: 'Frank Ferlito', email: 'fferlito@shipstc.com', passwordHash: pw, role: 'STC_EXECUTIVE' } })
  await prisma.user.upsert({ where: { email: 'jkuka@shipstc.com' }, update: { name: 'Jason Kuka', passwordHash: pw, role: 'STC_EXECUTIVE' }, create: { name: 'Jason Kuka', email: 'jkuka@shipstc.com', passwordHash: pw, role: 'STC_EXECUTIVE' } })
  console.log('✓ Users')

  // ── SKUs ──────────────────────────────────────────────────────
  const barDescriptions = [
    'Kroger Endcap Display Module A', 'Kroger Endcap Display Module B',
    'Barrows Interactive Display - Medium', 'Barrows Interactive Display - Large',
    'Power Supply Unit 12V', 'HDMI Cable 6ft Commercial',
    'Display Frame Assembly - Black', 'Display Frame Assembly - Silver',
    'LED Backlight Strip Kit', 'Control Board v3.2',
    'Mounting Hardware Kit', 'Acrylic Front Panel',
    'Touch Sensor Module', 'Speaker Assembly 20W',
    'Media Player Unit', 'Base Stand Assembly',
    'Cable Management Kit', 'Anti-Glare Screen Filter',
    'Power Strip 6-Outlet', 'Remote Control Unit',
    'Barcode Scanner Module', 'Ethernet Switch 8-Port',
  ]

  const barSKUs = []
  for (let i = 1; i <= 22; i++) {
    const code = `SKU-BAR-KROG-${String(i).padStart(3, '0')}`
    const sku = await prisma.sKU.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: `BK-${String(i).padStart(3, '0')}`,
        description: barDescriptions[i - 1],
        client_id: cBAR.id,
        dims_l: 24 + (i % 5) * 4,
        dims_w: 18 + (i % 4) * 3,
        dims_h: 12 + (i % 3) * 6,
        weight_lbs: 15 + (i % 6) * 5,
        units_per_pallet: i <= 10 ? 20 : 30,
        low_stock_threshold: 50,
      }
    })
    barSKUs.push(sku)
  }

  const cvsSKU = await prisma.sKU.upsert({ where: { code: 'SKU-CVS-EB-001' }, update: {}, create: { code: 'SKU-CVS-EB-001', name: 'CVS-EB-001', description: 'CVS Energy Bar Display Unit - Standard', client_id: cCVS.id, dims_l: 36, dims_w: 24, dims_h: 18, weight_lbs: 45, units_per_pallet: 12, low_stock_threshold: 20 } })
  const kohSKU = await prisma.sKU.upsert({ where: { code: 'SKU-KOH-SAUNA-001' }, update: {}, create: { code: 'SKU-KOH-SAUNA-001', name: 'KOH-SAUNA-001', description: 'Kohler Sauna Installation Kit - Full', client_id: cKOH.id, dims_l: 72, dims_w: 48, dims_h: 36, weight_lbs: 280, units_per_pallet: 2, low_stock_threshold: 5 } })
  console.log('✓ SKUs')

  // ── ProjectSKU links ──────────────────────────────────────────
  for (const sku of barSKUs) {
    await prisma.projectSKU.upsert({ where: { project_id_sku_id: { project_id: pBAR.id, sku_id: sku.id } }, update: {}, create: { project_id: pBAR.id, sku_id: sku.id } })
  }
  await prisma.projectSKU.upsert({ where: { project_id_sku_id: { project_id: pCVS.id, sku_id: cvsSKU.id } }, update: {}, create: { project_id: pCVS.id, sku_id: cvsSKU.id } })
  await prisma.projectSKU.upsert({ where: { project_id_sku_id: { project_id: pKOH.id, sku_id: kohSKU.id } }, update: {}, create: { project_id: pKOH.id, sku_id: kohSKU.id } })
  console.log('✓ ProjectSKU links')

  // ── Stores (230 Barrows/Kroger) ───────────────────────────────
  // CMH=91 (Midwest), MEM=83 (Southeast), LAX=56 (West)

  type CityRow = { city: string; state: string; zip: string; airport: string }

  const midwestCities: CityRow[] = [
    { city: 'Columbus', state: 'OH', zip: '43201', airport: 'CMH' }, { city: 'Cleveland', state: 'OH', zip: '44101', airport: 'CLE' },
    { city: 'Cincinnati', state: 'OH', zip: '45201', airport: 'CVG' }, { city: 'Toledo', state: 'OH', zip: '43601', airport: 'TOL' },
    { city: 'Dayton', state: 'OH', zip: '45401', airport: 'DAY' }, { city: 'Akron', state: 'OH', zip: '44301', airport: 'CAK' },
    { city: 'Youngstown', state: 'OH', zip: '44501', airport: 'YNG' }, { city: 'Canton', state: 'OH', zip: '44701', airport: 'CAK' },
    { city: 'Lorain', state: 'OH', zip: '44052', airport: 'CLE' }, { city: 'Hamilton', state: 'OH', zip: '45011', airport: 'CVG' },
    { city: 'Springfield', state: 'OH', zip: '45501', airport: 'DAY' }, { city: 'Kettering', state: 'OH', zip: '45429', airport: 'DAY' },
    { city: 'Elyria', state: 'OH', zip: '44035', airport: 'CLE' }, { city: 'Lakewood', state: 'OH', zip: '44107', airport: 'CLE' },
    { city: 'Parma', state: 'OH', zip: '44129', airport: 'CLE' }, { city: 'Detroit', state: 'MI', zip: '48201', airport: 'DTW' },
    { city: 'Grand Rapids', state: 'MI', zip: '49501', airport: 'GRR' }, { city: 'Warren', state: 'MI', zip: '48088', airport: 'DTW' },
    { city: 'Sterling Heights', state: 'MI', zip: '48310', airport: 'DTW' }, { city: 'Ann Arbor', state: 'MI', zip: '48101', airport: 'DTW' },
    { city: 'Lansing', state: 'MI', zip: '48901', airport: 'LAN' }, { city: 'Flint', state: 'MI', zip: '48501', airport: 'FNT' },
    { city: 'Dearborn', state: 'MI', zip: '48120', airport: 'DTW' }, { city: 'Livonia', state: 'MI', zip: '48150', airport: 'DTW' },
    { city: 'Westland', state: 'MI', zip: '48185', airport: 'DTW' }, { city: 'Indianapolis', state: 'IN', zip: '46201', airport: 'IND' },
    { city: 'Fort Wayne', state: 'IN', zip: '46801', airport: 'FWA' }, { city: 'Evansville', state: 'IN', zip: '47701', airport: 'EVV' },
    { city: 'South Bend', state: 'IN', zip: '46601', airport: 'SBN' }, { city: 'Hammond', state: 'IN', zip: '46320', airport: 'ORD' },
    { city: 'Chicago', state: 'IL', zip: '60601', airport: 'ORD' }, { city: 'Aurora', state: 'IL', zip: '60505', airport: 'ORD' },
    { city: 'Joliet', state: 'IL', zip: '60432', airport: 'MDW' }, { city: 'Naperville', state: 'IL', zip: '60563', airport: 'ORD' },
    { city: 'Rockford', state: 'IL', zip: '61101', airport: 'RFD' }, { city: 'Springfield', state: 'IL', zip: '62701', airport: 'SPI' },
    { city: 'Peoria', state: 'IL', zip: '61601', airport: 'PIA' }, { city: 'Elgin', state: 'IL', zip: '60120', airport: 'ORD' },
    { city: 'Waukegan', state: 'IL', zip: '60085', airport: 'ORD' }, { city: 'Cicero', state: 'IL', zip: '60804', airport: 'MDW' },
    { city: 'Louisville', state: 'KY', zip: '40201', airport: 'SDF' }, { city: 'Lexington', state: 'KY', zip: '40501', airport: 'LEX' },
    { city: 'Bowling Green', state: 'KY', zip: '42101', airport: 'BNA' }, { city: 'Owensboro', state: 'KY', zip: '42301', airport: 'OWB' },
    { city: 'Pittsburgh', state: 'PA', zip: '15201', airport: 'PIT' }, { city: 'Allentown', state: 'PA', zip: '18101', airport: 'ABE' },
    { city: 'Erie', state: 'PA', zip: '16501', airport: 'ERI' }, { city: 'Reading', state: 'PA', zip: '19601', airport: 'ABE' },
    { city: 'Scranton', state: 'PA', zip: '18501', airport: 'AVP' }, { city: 'Bethlehem', state: 'PA', zip: '18015', airport: 'ABE' },
    { city: 'Lancaster', state: 'PA', zip: '17601', airport: 'LNS' }, { city: 'Harrisburg', state: 'PA', zip: '17101', airport: 'MDT' },
    { city: 'York', state: 'PA', zip: '17401', airport: 'MDT' }, { city: 'Buffalo', state: 'NY', zip: '14201', airport: 'BUF' },
    { city: 'Rochester', state: 'NY', zip: '14601', airport: 'ROC' }, { city: 'Yonkers', state: 'NY', zip: '10701', airport: 'JFK' },
    { city: 'Syracuse', state: 'NY', zip: '13201', airport: 'SYR' }, { city: 'Albany', state: 'NY', zip: '12201', airport: 'ALB' },
    { city: 'New Rochelle', state: 'NY', zip: '10801', airport: 'JFK' }, { city: 'Mount Vernon', state: 'NY', zip: '10550', airport: 'LGA' },
    { city: 'Kansas City', state: 'MO', zip: '64101', airport: 'MCI' }, { city: 'St. Louis', state: 'MO', zip: '63101', airport: 'STL' },
    { city: 'Springfield', state: 'MO', zip: '65801', airport: 'SGF' }, { city: 'Independence', state: 'MO', zip: '64050', airport: 'MCI' },
    { city: 'Columbia', state: 'MO', zip: '65201', airport: 'COU' }, { city: 'St. Joseph', state: 'MO', zip: '64501', airport: 'MCI' },
    { city: 'Charleston', state: 'WV', zip: '25301', airport: 'CRW' }, { city: 'Huntington', state: 'WV', zip: '25701', airport: 'HTS' },
    { city: 'Minneapolis', state: 'MN', zip: '55401', airport: 'MSP' }, { city: 'St. Paul', state: 'MN', zip: '55101', airport: 'MSP' },
    { city: 'Rochester', state: 'MN', zip: '55901', airport: 'RST' }, { city: 'Duluth', state: 'MN', zip: '55801', airport: 'DLH' },
    { city: 'Milwaukee', state: 'WI', zip: '53201', airport: 'MKE' }, { city: 'Madison', state: 'WI', zip: '53701', airport: 'MSN' },
    { city: 'Green Bay', state: 'WI', zip: '54301', airport: 'GRB' }, { city: 'Kenosha', state: 'WI', zip: '53140', airport: 'MKE' },
    { city: 'Racine', state: 'WI', zip: '53401', airport: 'MKE' }, { city: 'Appleton', state: 'WI', zip: '54911', airport: 'ATW' },
    { city: 'Waukesha', state: 'WI', zip: '53186', airport: 'MKE' }, { city: 'Oshkosh', state: 'WI', zip: '54901', airport: 'OSH' },
    { city: 'Omaha', state: 'NE', zip: '68101', airport: 'OMA' }, { city: 'Lincoln', state: 'NE', zip: '68501', airport: 'LNK' },
    { city: 'Des Moines', state: 'IA', zip: '50301', airport: 'DSM' }, { city: 'Cedar Rapids', state: 'IA', zip: '52401', airport: 'CID' },
    { city: 'Davenport', state: 'IA', zip: '52801', airport: 'MLI' }, { city: 'Sioux City', state: 'IA', zip: '51101', airport: 'SUX' },
    { city: 'Bloomington', state: 'MN', zip: '55420', airport: 'MSP' }, { city: 'Eau Claire', state: 'WI', zip: '54701', airport: 'EAU' },
    { city: 'Elgin', state: 'IL', zip: '60123', airport: 'ORD' }, { city: 'Troy', state: 'MI', zip: '48083', airport: 'DTW' },
  ]

  const southeastCities: CityRow[] = [
    { city: 'Memphis', state: 'TN', zip: '38101', airport: 'MEM' }, { city: 'Nashville', state: 'TN', zip: '37201', airport: 'BNA' },
    { city: 'Knoxville', state: 'TN', zip: '37901', airport: 'TYS' }, { city: 'Chattanooga', state: 'TN', zip: '37401', airport: 'CHA' },
    { city: 'Clarksville', state: 'TN', zip: '37040', airport: 'BNA' }, { city: 'Murfreesboro', state: 'TN', zip: '37129', airport: 'BNA' },
    { city: 'Jackson', state: 'TN', zip: '38301', airport: 'MEM' }, { city: 'Johnson City', state: 'TN', zip: '37601', airport: 'TRI' },
    { city: 'Atlanta', state: 'GA', zip: '30301', airport: 'ATL' }, { city: 'Columbus', state: 'GA', zip: '31901', airport: 'CSG' },
    { city: 'Augusta', state: 'GA', zip: '30901', airport: 'AGS' }, { city: 'Savannah', state: 'GA', zip: '31401', airport: 'SAV' },
    { city: 'Macon', state: 'GA', zip: '31201', airport: 'MCN' }, { city: 'Roswell', state: 'GA', zip: '30075', airport: 'ATL' },
    { city: 'Albany', state: 'GA', zip: '31701', airport: 'ABY' }, { city: 'Marietta', state: 'GA', zip: '30060', airport: 'ATL' },
    { city: 'Warner Robins', state: 'GA', zip: '31088', airport: 'WRB' }, { city: 'Birmingham', state: 'AL', zip: '35201', airport: 'BHM' },
    { city: 'Montgomery', state: 'AL', zip: '36101', airport: 'MGM' }, { city: 'Huntsville', state: 'AL', zip: '35801', airport: 'HSV' },
    { city: 'Mobile', state: 'AL', zip: '36601', airport: 'MOB' }, { city: 'Tuscaloosa', state: 'AL', zip: '35401', airport: 'TCL' },
    { city: 'Hoover', state: 'AL', zip: '35244', airport: 'BHM' }, { city: 'Dothan', state: 'AL', zip: '36301', airport: 'DHN' },
    { city: 'Jacksonville', state: 'FL', zip: '32099', airport: 'JAX' }, { city: 'Miami', state: 'FL', zip: '33101', airport: 'MIA' },
    { city: 'Tampa', state: 'FL', zip: '33601', airport: 'TPA' }, { city: 'Orlando', state: 'FL', zip: '32801', airport: 'MCO' },
    { city: 'St. Petersburg', state: 'FL', zip: '33701', airport: 'PIE' }, { city: 'Hialeah', state: 'FL', zip: '33010', airport: 'MIA' },
    { city: 'Tallahassee', state: 'FL', zip: '32301', airport: 'TLH' }, { city: 'Fort Lauderdale', state: 'FL', zip: '33301', airport: 'FLL' },
    { city: 'Port St. Lucie', state: 'FL', zip: '34952', airport: 'PBI' }, { city: 'Cape Coral', state: 'FL', zip: '33901', airport: 'RSW' },
    { city: 'Pembroke Pines', state: 'FL', zip: '33024', airport: 'FLL' }, { city: 'Jackson', state: 'MS', zip: '39201', airport: 'JAN' },
    { city: 'Gulfport', state: 'MS', zip: '39501', airport: 'GPT' }, { city: 'Southaven', state: 'MS', zip: '38671', airport: 'MEM' },
    { city: 'Hattiesburg', state: 'MS', zip: '39401', airport: 'PIB' }, { city: 'Biloxi', state: 'MS', zip: '39530', airport: 'GPT' },
    { city: 'Little Rock', state: 'AR', zip: '72201', airport: 'LIT' }, { city: 'Fort Smith', state: 'AR', zip: '72901', airport: 'FSM' },
    { city: 'Fayetteville', state: 'AR', zip: '72701', airport: 'XNA' }, { city: 'Springdale', state: 'AR', zip: '72764', airport: 'XNA' },
    { city: 'Jonesboro', state: 'AR', zip: '72401', airport: 'JBR' }, { city: 'New Orleans', state: 'LA', zip: '70112', airport: 'MSY' },
    { city: 'Baton Rouge', state: 'LA', zip: '70801', airport: 'BTR' }, { city: 'Shreveport', state: 'LA', zip: '71101', airport: 'SHV' },
    { city: 'Metairie', state: 'LA', zip: '70001', airport: 'MSY' }, { city: 'Lafayette', state: 'LA', zip: '70501', airport: 'LFT' },
    { city: 'Lake Charles', state: 'LA', zip: '70601', airport: 'LCH' }, { city: 'Charlotte', state: 'NC', zip: '28201', airport: 'CLT' },
    { city: 'Raleigh', state: 'NC', zip: '27601', airport: 'RDU' }, { city: 'Greensboro', state: 'NC', zip: '27401', airport: 'GSO' },
    { city: 'Durham', state: 'NC', zip: '27701', airport: 'RDU' }, { city: 'Winston-Salem', state: 'NC', zip: '27101', airport: 'INT' },
    { city: 'Fayetteville', state: 'NC', zip: '28301', airport: 'FAY' }, { city: 'Wilmington', state: 'NC', zip: '28401', airport: 'ILM' },
    { city: 'Columbia', state: 'SC', zip: '29201', airport: 'CAE' }, { city: 'Charleston', state: 'SC', zip: '29401', airport: 'CHS' },
    { city: 'North Charleston', state: 'SC', zip: '29405', airport: 'CHS' }, { city: 'Greenville', state: 'SC', zip: '29601', airport: 'GSP' },
    { city: 'Rock Hill', state: 'SC', zip: '29730', airport: 'CLT' }, { city: 'Norfolk', state: 'VA', zip: '23501', airport: 'ORF' },
    { city: 'Virginia Beach', state: 'VA', zip: '23451', airport: 'ORF' }, { city: 'Richmond', state: 'VA', zip: '23219', airport: 'RIC' },
    { city: 'Chesapeake', state: 'VA', zip: '23320', airport: 'ORF' }, { city: 'Newport News', state: 'VA', zip: '23601', airport: 'PHF' },
    { city: 'Hampton', state: 'VA', zip: '23661', airport: 'PHF' }, { city: 'Roanoke', state: 'VA', zip: '24011', airport: 'ROA' },
    { city: 'Baltimore', state: 'MD', zip: '21201', airport: 'BWI' }, { city: 'Frederick', state: 'MD', zip: '21701', airport: 'IAD' },
    { city: 'Rockville', state: 'MD', zip: '20850', airport: 'IAD' }, { city: 'Gaithersburg', state: 'MD', zip: '20877', airport: 'IAD' },
    { city: 'Bowie', state: 'MD', zip: '20715', airport: 'BWI' }, { city: 'Hagerstown', state: 'MD', zip: '21740', airport: 'HGR' },
    { city: 'Gainesville', state: 'FL', zip: '32601', airport: 'GNV' }, { city: 'Pensacola', state: 'FL', zip: '32501', airport: 'PNS' },
    { city: 'Miramar', state: 'FL', zip: '33025', airport: 'FLL' }, { city: 'Lexington Park', state: 'MD', zip: '20653', airport: 'BWI' },
  ]

  const westCities: CityRow[] = [
    { city: 'Los Angeles', state: 'CA', zip: '90001', airport: 'LAX' }, { city: 'San Diego', state: 'CA', zip: '92101', airport: 'SAN' },
    { city: 'San Jose', state: 'CA', zip: '95101', airport: 'SJC' }, { city: 'San Francisco', state: 'CA', zip: '94102', airport: 'SFO' },
    { city: 'Fresno', state: 'CA', zip: '93701', airport: 'FAT' }, { city: 'Sacramento', state: 'CA', zip: '95814', airport: 'SMF' },
    { city: 'Long Beach', state: 'CA', zip: '90801', airport: 'LGB' }, { city: 'Oakland', state: 'CA', zip: '94601', airport: 'OAK' },
    { city: 'Bakersfield', state: 'CA', zip: '93301', airport: 'BFL' }, { city: 'Anaheim', state: 'CA', zip: '92801', airport: 'SNA' },
    { city: 'Riverside', state: 'CA', zip: '92501', airport: 'ONT' }, { city: 'Santa Ana', state: 'CA', zip: '92701', airport: 'SNA' },
    { city: 'Stockton', state: 'CA', zip: '95201', airport: 'SCK' }, { city: 'Irvine', state: 'CA', zip: '92602', airport: 'SNA' },
    { city: 'Chula Vista', state: 'CA', zip: '91910', airport: 'SAN' }, { city: 'Fremont', state: 'CA', zip: '94536', airport: 'OAK' },
    { city: 'Modesto', state: 'CA', zip: '95351', airport: 'MOD' }, { city: 'Fontana', state: 'CA', zip: '92335', airport: 'ONT' },
    { city: 'Oxnard', state: 'CA', zip: '93030', airport: 'OXR' }, { city: 'Moreno Valley', state: 'CA', zip: '92553', airport: 'ONT' },
    { city: 'Las Vegas', state: 'NV', zip: '89101', airport: 'LAS' }, { city: 'Henderson', state: 'NV', zip: '89002', airport: 'LAS' },
    { city: 'Reno', state: 'NV', zip: '89501', airport: 'RNO' }, { city: 'Phoenix', state: 'AZ', zip: '85001', airport: 'PHX' },
    { city: 'Tucson', state: 'AZ', zip: '85701', airport: 'TUS' }, { city: 'Mesa', state: 'AZ', zip: '85201', airport: 'PHX' },
    { city: 'Chandler', state: 'AZ', zip: '85224', airport: 'PHX' }, { city: 'Scottsdale', state: 'AZ', zip: '85251', airport: 'PHX' },
    { city: 'Glendale', state: 'AZ', zip: '85301', airport: 'PHX' }, { city: 'Gilbert', state: 'AZ', zip: '85234', airport: 'PHX' },
    { city: 'Seattle', state: 'WA', zip: '98101', airport: 'SEA' }, { city: 'Spokane', state: 'WA', zip: '99201', airport: 'GEG' },
    { city: 'Tacoma', state: 'WA', zip: '98401', airport: 'SEA' }, { city: 'Vancouver', state: 'WA', zip: '98660', airport: 'PDX' },
    { city: 'Bellevue', state: 'WA', zip: '98004', airport: 'SEA' }, { city: 'Portland', state: 'OR', zip: '97201', airport: 'PDX' },
    { city: 'Eugene', state: 'OR', zip: '97401', airport: 'EUG' }, { city: 'Salem', state: 'OR', zip: '97301', airport: 'SLE' },
    { city: 'Gresham', state: 'OR', zip: '97030', airport: 'PDX' }, { city: 'Denver', state: 'CO', zip: '80201', airport: 'DEN' },
    { city: 'Colorado Springs', state: 'CO', zip: '80901', airport: 'COS' }, { city: 'Aurora', state: 'CO', zip: '80010', airport: 'DEN' },
    { city: 'Fort Collins', state: 'CO', zip: '80521', airport: 'DEN' }, { city: 'Lakewood', state: 'CO', zip: '80215', airport: 'DEN' },
    { city: 'Salt Lake City', state: 'UT', zip: '84101', airport: 'SLC' }, { city: 'West Valley City', state: 'UT', zip: '84119', airport: 'SLC' },
    { city: 'Provo', state: 'UT', zip: '84601', airport: 'PVU' }, { city: 'West Jordan', state: 'UT', zip: '84088', airport: 'SLC' },
    { city: 'Boise', state: 'ID', zip: '83701', airport: 'BOI' }, { city: 'Nampa', state: 'ID', zip: '83651', airport: 'BOI' },
    { city: 'Meridian', state: 'ID', zip: '83642', airport: 'BOI' }, { city: 'Albuquerque', state: 'NM', zip: '87101', airport: 'ABQ' },
    { city: 'Las Cruces', state: 'NM', zip: '88001', airport: 'ELP' }, { city: 'Santa Fe', state: 'NM', zip: '87501', airport: 'SAF' },
    { city: 'Billings', state: 'MT', zip: '59101', airport: 'BIL' }, { city: 'Missoula', state: 'MT', zip: '59801', airport: 'MSO' },
    { city: 'Anchorage', state: 'AK', zip: '99501', airport: 'ANC' }, { city: 'Honolulu', state: 'HI', zip: '96801', airport: 'HNL' },
  ]

  const regionConfigs = [
    { cities: midwestCities, count: 91, whId: wCMH.id, tag: 'CMH', region: 'Midwest', regionCode: 'MW' },
    { cities: southeastCities, count: 83, whId: wMEM.id, tag: 'MEM', region: 'Southeast', regionCode: 'SE' },
    { cities: westCities, count: 56, whId: wLAX.id, tag: 'LAX', region: 'West', regionCode: 'WC' },
  ]

  // Check if stores already seeded
  const existingStoreCount = await prisma.store.count({ where: { project_id: pBAR.id } })
  if (existingStoreCount === 0) {
    let globalSeq = 1
    for (const rc of regionConfigs) {
      const storeRows = []
      for (let i = 0; i < rc.count; i++) {
        const city = rc.cities[i % rc.cities.length]
        const localSeq = i + 1
        storeRows.push({
          freight_stc_num: `FSTC-${String(globalSeq).padStart(4, '0')}`,
          wh_stc_num: `${rc.tag}-${String(localSeq).padStart(3, '0')}`,
          region: rc.region,
          region_code: rc.regionCode,
          store_num: `KR-${String(globalSeq).padStart(4, '0')}`,
          subcode: 'KRG',
          address: `${1000 + globalSeq} Commerce Blvd`,
          city: city.city,
          state: city.state,
          zip: city.zip,
          airport_code: city.airport,
          origin_wh_tag: rc.tag,
          project_id: pBAR.id,
          assigned_warehouse_id: rc.whId,
        })
        globalSeq++
      }
      await prisma.store.createMany({ data: storeRows })
    }
    console.log('✓ Stores (230 created)')
  } else {
    console.log(`✓ Stores (${existingStoreCount} already exist, skipped)`)
  }

  // ── Inventory ─────────────────────────────────────────────────
  // Barrows/Kroger SKUs across CMH, MEM, LAX
  const invWarehouses = [
    { wh: wCMH, onHand: 460, allocated: 91 },
    { wh: wMEM, onHand: 415, allocated: 83 },
    { wh: wLAX, onHand: 280, allocated: 56 },
  ]
  for (const barSKU of barSKUs) {
    for (const { wh, onHand, allocated } of invWarehouses) {
      await prisma.inventory.upsert({
        where: { warehouse_id_sku_id: { warehouse_id: wh.id, sku_id: barSKU.id } },
        update: {},
        create: { warehouse_id: wh.id, sku_id: barSKU.id, on_hand: onHand + Math.floor(Math.random() * 50), allocated },
      })
    }
  }
  // CVS SKU at EWR
  await prisma.inventory.upsert({ where: { warehouse_id_sku_id: { warehouse_id: wEWR.id, sku_id: cvsSKU.id } }, update: {}, create: { warehouse_id: wEWR.id, sku_id: cvsSKU.id, on_hand: 240, allocated: 48 } })
  // Kohler SKU at DFW
  await prisma.inventory.upsert({ where: { warehouse_id_sku_id: { warehouse_id: wDFW.id, sku_id: kohSKU.id } }, update: {}, create: { warehouse_id: wDFW.id, sku_id: kohSKU.id, on_hand: 18, allocated: 4 } })
  console.log('✓ Inventory')

  // ── Inventory Lots ────────────────────────────────────────────
  const lotCount = await prisma.inventoryLot.count()
  if (lotCount === 0) {
    const lotRows = []
    for (const barSKU of barSKUs.slice(0, 5)) {
      for (const wh of [wCMH, wMEM, wLAX]) {
        const baseDate = new Date()
        baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 60 + 10))
        lotRows.push({ sku_id: barSKU.id, warehouse_id: wh.id, qty: 100 + Math.floor(Math.random() * 200), received_date: baseDate })
      }
    }
    await prisma.inventoryLot.createMany({ data: lotRows })
    console.log('✓ Inventory lots')
  }

  // ── ASNs ──────────────────────────────────────────────────────
  const asn1 = await prisma.aSN.upsert({
    where: { code: 'ASN-BAR-2024-001' }, update: {},
    create: { code: 'ASN-BAR-2024-001', client_id: cBAR.id, warehouse_id: wCMH.id, status: 'RECEIVED', expected_date: new Date('2024-11-01'), notes: 'Initial Barrows/Kroger rollout shipment - CMH' }
  })
  const asn2 = await prisma.aSN.upsert({
    where: { code: 'ASN-BAR-2024-002' }, update: {},
    create: { code: 'ASN-BAR-2024-002', client_id: cBAR.id, warehouse_id: wMEM.id, status: 'RECEIVED', expected_date: new Date('2024-11-05'), notes: 'Initial Barrows/Kroger rollout shipment - MEM' }
  })
  const asn3 = await prisma.aSN.upsert({
    where: { code: 'ASN-BAR-2024-003' }, update: {},
    create: { code: 'ASN-BAR-2024-003', client_id: cBAR.id, warehouse_id: wLAX.id, status: 'IN_TRANSIT', expected_date: new Date('2024-12-10'), notes: 'West coast replenishment' }
  })
  const asn4 = await prisma.aSN.upsert({
    where: { code: 'ASN-CVS-2024-001' }, update: {},
    create: { code: 'ASN-CVS-2024-001', client_id: cCVS.id, warehouse_id: wEWR.id, status: 'SCHEDULED', expected_date: new Date('2024-12-20'), notes: 'CVS Energy Bar displays Q1 2025' }
  })

  // ASN Lines
  const asnLineCount = await prisma.aSNLine.count()
  if (asnLineCount === 0) {
    const asnLineRows = []
    for (const barSKU of barSKUs) {
      asnLineRows.push({ asn_id: asn1.id, sku_id: barSKU.id, expected_qty: 100 })
      asnLineRows.push({ asn_id: asn2.id, sku_id: barSKU.id, expected_qty: 80 })
      asnLineRows.push({ asn_id: asn3.id, sku_id: barSKU.id, expected_qty: 60 })
    }
    asnLineRows.push({ asn_id: asn4.id, sku_id: cvsSKU.id, expected_qty: 240 })
    await prisma.aSNLine.createMany({ data: asnLineRows })
    console.log('✓ ASN lines')
  }

  // ── Inbound Receipts ──────────────────────────────────────────
  const receipt1 = await prisma.inboundReceipt.upsert({
    where: { code: 'RCT-CMH-2024-001' }, update: {},
    create: { code: 'RCT-CMH-2024-001', asn_id: asn1.id, status: 'COMPLETE', received_at: new Date('2024-11-02'), notes: 'All units received, no discrepancies' }
  })
  const receipt2 = await prisma.inboundReceipt.upsert({
    where: { code: 'RCT-MEM-2024-001' }, update: {},
    create: { code: 'RCT-MEM-2024-001', asn_id: asn2.id, status: 'DISCREPANCY', received_at: new Date('2024-11-06'), notes: 'SKU-BAR-KROG-003 received 78 of 80 expected' }
  })

  const rcptLineCount = await prisma.receiptLine.count()
  if (rcptLineCount === 0) {
    const rcptLines = []
    for (const barSKU of barSKUs.slice(0, 5)) {
      rcptLines.push({ receipt_id: receipt1.id, sku_id: barSKU.id, expected_qty: 100, received_qty: 100 })
      rcptLines.push({ receipt_id: receipt2.id, sku_id: barSKU.id, expected_qty: 80, received_qty: barSKU.id === barSKUs[2].id ? 78 : 80, discrepancy_type: barSKU.id === barSKUs[2].id ? 'MISSING_ITEM' : null, notes: barSKU.id === barSKUs[2].id ? 'Short 2 units' : null })
    }
    await prisma.receiptLine.createMany({ data: rcptLines })
    console.log('✓ Receipt lines')
  }

  // ── Packages ──────────────────────────────────────────────────
  const pkgCount = await prisma.package.count()
  if (pkgCount === 0) {
    await prisma.package.createMany({
      data: [
        { code: 'PKG-CMH-2024-001', warehouse_id: wCMH.id, asn_id: asn1.id, status: 'RECEIVED', carrier: 'FedEx', tracking: '7489234892349234' },
        { code: 'PKG-CMH-2024-002', warehouse_id: wCMH.id, asn_id: asn1.id, status: 'RECEIVED', carrier: 'FedEx', tracking: '7489234892349235' },
        { code: 'PKG-MEM-2024-001', warehouse_id: wMEM.id, asn_id: asn2.id, status: 'QUARANTINED', carrier: 'UPS', tracking: '1Z999AA10123456784', notes: 'Water damage on exterior' },
        { code: 'PKG-LAX-2024-001', warehouse_id: wLAX.id, status: 'EXPECTED', carrier: 'FedEx', tracking: '7489234892349300' },
      ]
    })
    console.log('✓ Packages')
  }

  // ── Orders ────────────────────────────────────────────────────
  // Pull a few stores for orders
  const stores = await prisma.store.findMany({ where: { project_id: pBAR.id }, take: 5 })
  const [s1, s2, s3, s4, s5] = stores

  const ord1 = await prisma.order.upsert({
    where: { code: 'STC-ORD-2024-0001' }, update: {},
    create: { code: 'STC-ORD-2024-0001', client_id: cBAR.id, warehouse_id: wCMH.id, store_id: s1?.id, load_type: 'PALLETIZED', status: 'COMPLETE', notes: 'Kroger rollout - Columbus wave 1' }
  })
  const ord2 = await prisma.order.upsert({
    where: { code: 'STC-ORD-2024-0002' }, update: {},
    create: { code: 'STC-ORD-2024-0002', client_id: cBAR.id, warehouse_id: wCMH.id, store_id: s2?.id, load_type: 'PALLETIZED', status: 'READY', notes: 'Kroger rollout - Columbus wave 2' }
  })
  const ord3 = await prisma.order.upsert({
    where: { code: 'STC-ORD-2024-0003' }, update: {},
    create: { code: 'STC-ORD-2024-0003', client_id: cBAR.id, warehouse_id: wMEM.id, store_id: s3?.id, load_type: 'PALLETIZED', status: 'ALLOCATED', notes: 'Kroger rollout - Memphis wave 1' }
  })
  const ord4 = await prisma.order.upsert({
    where: { code: 'STC-ORD-2024-0004' }, update: {},
    create: { code: 'STC-ORD-2024-0004', client_id: cBAR.id, warehouse_id: wLAX.id, store_id: s4?.id, load_type: 'PALLETIZED', status: 'DRAFT', notes: 'Kroger rollout - LA wave 1' }
  })
  const ord5 = await prisma.order.upsert({
    where: { code: 'STC-ORD-2024-0005' }, update: {},
    create: { code: 'STC-ORD-2024-0005', client_id: cCVS.id, warehouse_id: wEWR.id, load_type: 'FLOOR_LOADED', status: 'AT_RISK', notes: 'CVS Energy Bar displays - NJ distribution' }
  })

  const ordLineCount = await prisma.orderLine.count()
  if (ordLineCount === 0) {
    const ordLines = []
    for (const barSKU of barSKUs.slice(0, 8)) {
      ordLines.push({ order_id: ord1.id, sku_id: barSKU.id, ordered_qty: 5, allocated: 5, shipped: 5 })
      ordLines.push({ order_id: ord2.id, sku_id: barSKU.id, ordered_qty: 5, allocated: 5, shipped: 0 })
      ordLines.push({ order_id: ord3.id, sku_id: barSKU.id, ordered_qty: 4, allocated: 4, shipped: 0 })
      ordLines.push({ order_id: ord4.id, sku_id: barSKU.id, ordered_qty: 4, allocated: 0, shipped: 0 })
    }
    ordLines.push({ order_id: ord5.id, sku_id: cvsSKU.id, ordered_qty: 48, allocated: 36, shipped: 0 })
    await prisma.orderLine.createMany({ data: ordLines })
    console.log('✓ Order lines')
  }

  // ── Pallets ───────────────────────────────────────────────────
  const palletCount = await prisma.pallet.count()
  if (palletCount === 0) {
    const plt1 = await prisma.pallet.create({ data: { code: 'PLT-CMH-2024-001', warehouse_id: wCMH.id, order_id: ord1.id, length: 48, width: 40, height: 60, weight_lbs: 850, shrink_wrapped: true } })
    const plt2 = await prisma.pallet.create({ data: { code: 'PLT-CMH-2024-002', warehouse_id: wCMH.id, order_id: ord2.id, length: 48, width: 40, height: 52, weight_lbs: 720, shrink_wrapped: true } })
    const plt3 = await prisma.pallet.create({ data: { code: 'PLT-MEM-2024-001', warehouse_id: wMEM.id, order_id: ord3.id, length: 48, width: 40, height: 48, weight_lbs: 680, shrink_wrapped: false } })

    await prisma.palletItem.createMany({
      data: [
        { pallet_id: plt1.id, sku_id: barSKUs[0].id, qty: 20 },
        { pallet_id: plt1.id, sku_id: barSKUs[1].id, qty: 15 },
        { pallet_id: plt2.id, sku_id: barSKUs[0].id, qty: 20 },
        { pallet_id: plt2.id, sku_id: barSKUs[2].id, qty: 10 },
        { pallet_id: plt3.id, sku_id: barSKUs[3].id, qty: 18 },
      ]
    })

    // ── Shipments ─────────────────────────────────────────────────
    const shp1 = await prisma.shipment.create({ data: { code: 'SHP-CMH-2024-001', order_id: ord1.id, status: 'DELIVERED', carrier: 'FedEx Freight', pro_number: 'PRO123456789', tracking: '7489234892349000', shipped_at: new Date('2024-11-15'), delivered_at: new Date('2024-11-17') } })
    await prisma.shipmentPallet.create({ data: { shipment_id: shp1.id, pallet_id: plt1.id } })
    console.log('✓ Pallets, pallet items, and shipments')
  }

  // ── Discrepancies ─────────────────────────────────────────────
  const discrepancyCount = await prisma.discrepancy.count()
  if (discrepancyCount === 0) {
    await prisma.discrepancy.createMany({
      data: [
        { type: 'MISSING_ITEM', source_ref: 'RCT-MEM-2024-001', description: 'SKU-BAR-KROG-003: received 78 of 80 expected units. Short 2 units on arrival.', status: 'OPEN' },
        { type: 'WATER_DAMAGE', source_ref: 'PKG-MEM-2024-001', description: 'Package PKG-MEM-2024-001 shows exterior water damage. Contents under inspection.', status: 'UNDER_REVIEW' },
        { type: 'OVERAGE', source_ref: 'ASN-BAR-2024-001', description: 'Received 5 additional units of SKU-BAR-KROG-010 not on manifest.', status: 'RESOLVED', resolution: 'Extra units added to inventory per client approval.' },
      ]
    })
    console.log('✓ Discrepancies')
  }

  // ── Alert Rules ───────────────────────────────────────────────
  const alertCount = await prisma.alertRule.count()
  if (alertCount === 0) {
    await prisma.alertRule.createMany({
      data: [
        { name: 'Low Stock - Barrows/Kroger', type: 'LOW_STOCK', project_id: pBAR.id, threshold: 50, recipients: ['nick.schaffer@stclogistics.com', 'natalie.santos@stclogistics.com'], isActive: true },
        { name: 'Aging Inventory Alert', type: 'AGING_INVENTORY', threshold: 90, recipients: ['natalie.santos@stclogistics.com'], isActive: true },
        { name: 'Discrepancy Alert', type: 'DISCREPANCY', recipients: ['natalie.santos@stclogistics.com', 'jason.kuka@stclogistics.com'], isActive: true },
        { name: 'Unexpected Package Alert', type: 'UNEXPECTED_PACKAGE', recipients: ['frank.ferlito@stclogistics.com'], isActive: true },
        { name: 'Order Ready Notification', type: 'ORDER_READY', recipients: ['nick.schaffer@stclogistics.com', 'natalie.santos@stclogistics.com', 'jason.kuka@stclogistics.com'], isActive: true },
      ]
    })
    console.log('✓ Alert rules')
  }

  // ── BOL Template ──────────────────────────────────────────────
  const bolCount = await prisma.bOLTemplate.count()
  if (bolCount === 0) {
    await prisma.bOLTemplate.create({
      data: {
        name: 'STC Standard BOL',
        isDefault: true,
        template: JSON.stringify({
          header: { logo: true, company: 'STC Logistics', address: '100 Port Newark Blvd, Newark, NJ 07114' },
          fields: ['order_code', 'ship_date', 'carrier', 'pro_number', 'origin_warehouse', 'destination_store', 'pallet_count', 'total_weight', 'load_type'],
          footer: { signature_lines: ['Shipper', 'Carrier', 'Consignee'] }
        })
      }
    })
    await prisma.bOLTemplate.create({
      data: {
        name: 'Barrows/Kroger Rollout BOL',
        project_id: pBAR.id,
        isDefault: false,
        template: JSON.stringify({
          header: { logo: true, company: 'STC Logistics', project: 'Barrows / Kroger Store Rollout' },
          fields: ['order_code', 'ship_date', 'carrier', 'pro_number', 'origin_warehouse', 'store_num', 'freight_stc_num', 'airport_code', 'pallet_count', 'total_weight'],
          footer: { signature_lines: ['STC Shipper', 'Carrier', 'Kroger Receiving'] }
        })
      }
    })
    console.log('✓ BOL templates')
  }

  console.log('\n✅ Seed complete!')
  console.log(`   Warehouses: 5 | Clients: 4 | Projects: 3 | Users: 5`)
  console.log(`   SKUs: ${22 + 2} | Stores: 230 | Orders: 5 | ASNs: 4`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
