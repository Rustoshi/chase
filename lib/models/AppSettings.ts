import mongoose, { Document, Model, Schema } from "mongoose"

/**
 * Single-document collection — always queried / upserted by APP_SETTINGS_ID.
 * Use AppSettings.findByIdAndUpdate(APP_SETTINGS_ID, patch, { upsert: true, new: true })
 * everywhere. Never insert a second document.
 */
export const APP_SETTINGS_ID = "000000000000000000000001" as const

export interface ILoanProduct {
  type: string
  label: string
  minRate: number
  maxRate: number
  minTerm: number
  maxTerm: number
  minAmount: number
  maxAmount: number
}

export interface ISupportOffice {
  city: string
  type: string
  addressLine1: string
  addressLine2: string
  phone: string
}

export interface ISupportDepartment {
  name: string
  description: string
  email: string
}

export type ServiceStatus = "available" | "restricted" | "coming_soon" | "maintenance" | "disabled"

export interface IServiceConfig {
  enabled: boolean
  status:  ServiceStatus
  statusLabel: string
  description: string
}

export interface ITransferCode {
  enabled: boolean
  code: string
  message: string
  label: string
}

export interface ITransferCodeSettings {
  imfCode: ITransferCode
  swiftCode: ITransferCode
  imfClearanceCode: ITransferCode
  taxCode: ITransferCode
}

export interface IAppSettings extends Document {
  _id: mongoose.Types.ObjectId
  swapFeePercent: number
  swapMinAmount: number
  swapMaxAmount: number
  localTransferFee: number
  internationalTransferFee: number
  internationalTransferFeeType: "flat" | "percentage"
  internationalTransferFeePercent: number
  maxDailyTransferAmount: number
  defaultCurrency: string
  supportedCurrencies: string[]
  btcPriceSource: string
  fallbackBtcRate: number
  maintenanceMode: boolean
  maintenanceMessage?: string
  allowRegistration: boolean
  kycRequiredForTransfer: boolean
  loanMaxActivePerUser: number
  loanMaxLifetimeBorrowed: number
  loanRejectionCooldownDays: number
  loanMinAccountAgeDays: number
  loanMaxDebtToIncomeRatio: number
  loanProducts: ILoanProduct[]
  taxRefundEnabled: boolean
  taxRefundProcessingDays: number
  taxRefundMaxAmount: number
  taxRefundEligibleYears: number[]
  taxRefundRequiredKycTier: number
  taxRefundHoldDays: number
  // Card settings
  cardApplicationFee: number
  cardPhysicalFee: number
  cardMaxPerUser: number
  cardRequiredKycTier: number
  // Contact / support details (shown on public + user pages)
  supportPhone: string
  supportTextPhone: string
  supportEmail: string
  supportAddress: string
  supportOffices: ISupportOffice[]
  supportDepartments: ISupportDepartment[]
  careersEmail: string
  complianceEmail: string
  privacyEmail: string
  legalEmail: string
  // Per-service dashboard config
  loansService: IServiceConfig
  grantsService: IServiceConfig
  taxRefundsService: IServiceConfig
  cardsService: IServiceConfig
  // International transfer codes
  transferCodes: ITransferCodeSettings
  updatedAt: Date
  updatedBy?: mongoose.Types.ObjectId
}

const SupportOfficeSchema = new Schema<ISupportOffice>(
  {
    city:         { type: String, trim: true, default: "" },
    type:         { type: String, trim: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    phone:        { type: String, trim: true, default: "" },
  },
  { _id: false }
)

const SupportDepartmentSchema = new Schema<ISupportDepartment>(
  {
    name:        { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    email:       { type: String, trim: true, default: "" },
  },
  { _id: false }
)

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    _id:                      { type: Schema.Types.ObjectId },
    swapFeePercent:           { type: Number, default: 1.5, min: 0 },
    swapMinAmount:            { type: Number, default: 10, min: 0 },
    swapMaxAmount:            { type: Number, default: 50000, min: 0 },
    localTransferFee:         { type: Number, default: 0, min: 0 },
    internationalTransferFee: { type: Number, default: 15, min: 0 },
    internationalTransferFeeType: { type: String, enum: ["flat", "percentage"], default: "flat" },
    internationalTransferFeePercent: { type: Number, default: 2.5, min: 0, max: 100 },
    maxDailyTransferAmount:   { type: Number, default: 10000, min: 0 },
    defaultCurrency:          { type: String, default: "USD", uppercase: true, trim: true },
    supportedCurrencies:      {
      type: [String],
      default: [
        // North America
        "USD",  // US Dollar
        "CAD",  // Canadian Dollar
        "MXN",  // Mexican Peso
        // Europe
        "EUR",  // Euro
        "GBP",  // British Pound
        "CHF",  // Swiss Franc
        "SEK",  // Swedish Krona
        "NOK",  // Norwegian Krone
        "DKK",  // Danish Krone
        "PLN",  // Polish Zloty
        "CZK",  // Czech Koruna
        "HUF",  // Hungarian Forint
        "RON",  // Romanian Leu
        "BGN",  // Bulgarian Lev
        "HRK",  // Croatian Kuna
        // Asia Pacific
        "JPY",  // Japanese Yen
        "CNY",  // Chinese Yuan
        "INR",  // Indian Rupee
        "AUD",  // Australian Dollar
        "NZD",  // New Zealand Dollar
        "SGD",  // Singapore Dollar
        "HKD",  // Hong Kong Dollar
        "KRW",  // South Korean Won
        "TWD",  // Taiwan Dollar
        "THB",  // Thai Baht
        "IDR",  // Indonesian Rupiah
        "MYR",  // Malaysian Ringgit
        "PHP",  // Philippine Peso
        "VND",  // Vietnamese Dong
        // Middle East
        "ILS",  // Israeli Shekel
        "AED",  // UAE Dirham
        "SAR",  // Saudi Riyal
        "QAR",  // Qatari Riyal
        "KWD",  // Kuwaiti Dinar
        "BHD",  // Bahraini Dinar
        "OMR",  // Omani Rial
        // South America
        "BRL",  // Brazilian Real
        "ARS",  // Argentine Peso
        "CLP",  // Chilean Peso
        "COP",  // Colombian Peso
        "PEN",  // Peruvian Sol
        "UYU",  // Uruguayan Peso
        "PYG",  // Paraguayan Guarani
        "BOB",  // Bolivian Boliviano
        // Africa
        "ZAR",  // South African Rand
        "EGP",  // Egyptian Pound
        "KES",  // Kenyan Shilling
        "GHS",  // Ghanaian Cedi
        "TZS",  // Tanzanian Shilling
        "UGX",  // Ugandan Shilling
        "ZMW",  // Zambian Kwacha
        "BWP",  // Botswanan Pula
        "NAD",  // Namibian Dollar
        "MZN",  // Mozambican Metical
        "AOA",  // Angolan Kwanza
        "SCR",  // Seychellois Rupee
        "SRD",  // Surinamese Dollar
        // Eastern Europe & Central Asia
        "RUB",  // Russian Ruble
        "UAH",  // Ukrainian Hryvnia
        "KZT",  // Kazakhstani Tenge
        "GEL",  // Georgian Lari
        "AMD",  // Armenian Dram
        "AZN",  // Azerbaijani Manat
        // Others
        "TRY",  // Turkish Lira
        "PKR",  // Pakistani Rupee
        "BDT",  // Bangladeshi Taka
        "LKR",  // Sri Lankan Rupee
        "NPR",  // Nepalese Rupee
        "MUR",  // Mauritian Rupee
        "JMD",  // Jamaican Dollar
        "TTD",  // Trinidad and Tobago Dollar
        "BBD",  // Barbadian Dollar
        "XCD",  // East Caribbean Dollar
        "BZD",  // Belize Dollar
        "GTQ",  // Guatemalan Quetzal
        "HNL",  // Honduran Lempira
        "NIO",  // Nicaraguan Córdoba
        "CRC",  // Costa Rican Colón
        "PAB",  // Panamanian Balboa
        "DOP",  // Dominican Peso
        "CUP",  // Cuban Peso
        "HTG",  // Haitian Gourde
        "XAF",  // Central African CFA Franc
        "XOF",  // West African CFA Franc
        "XPF",  // CFP Franc
      ],
    },
    btcPriceSource:           { type: String, default: "coingecko" },
    fallbackBtcRate:          { type: Number, default: 65000, min: 0 },
    maintenanceMode:          { type: Boolean, default: false },
    maintenanceMessage:       { type: String },
    allowRegistration:        { type: Boolean, default: true },
    kycRequiredForTransfer:   { type: Boolean, default: true },
    loanMaxActivePerUser:     { type: Number, default: 1, min: 1 },
    loanMaxLifetimeBorrowed:  { type: Number, default: 500000, min: 0 },
    loanRejectionCooldownDays:{ type: Number, default: 30, min: 0 },
    loanMinAccountAgeDays:    { type: Number, default: 30, min: 0 },
    loanMaxDebtToIncomeRatio: { type: Number, default: 0.4, min: 0, max: 1 },
    loanProducts:             {
      type: [{
        type:      { type: String, required: true },
        label:     { type: String, required: true },
        minRate:   { type: Number, required: true, min: 0 },
        maxRate:   { type: Number, required: true, min: 0 },
        minTerm:   { type: Number, required: true, min: 1 },
        maxTerm:   { type: Number, required: true, min: 1 },
        minAmount: { type: Number, required: true, min: 0 },
        maxAmount: { type: Number, required: true, min: 0 },
      }],
      default: [
        { type: "personal",  label: "Personal Loan",  minRate: 8,  maxRate: 24, minTerm: 6,  maxTerm: 60,  minAmount: 500,   maxAmount: 50000  },
        { type: "auto",      label: "Auto Loan",      minRate: 5,  maxRate: 15, minTerm: 12, maxTerm: 84,  minAmount: 5000,  maxAmount: 100000 },
        { type: "home",      label: "Home Loan",      minRate: 3,  maxRate: 8,  minTerm: 60, maxTerm: 360, minAmount: 50000, maxAmount: 500000 },
        { type: "education", label: "Education Loan", minRate: 4,  maxRate: 12, minTerm: 12, maxTerm: 120, minAmount: 1000,  maxAmount: 100000 },
        { type: "business",  label: "Business Loan",  minRate: 7,  maxRate: 20, minTerm: 6,  maxTerm: 60,  minAmount: 10000, maxAmount: 250000 },
      ],
    },
    taxRefundEnabled:          { type: Boolean, default: true },
    taxRefundProcessingDays:   { type: Number, default: 21, min: 1 },
    taxRefundMaxAmount:        { type: Number, default: 50000, min: 0 },
    taxRefundEligibleYears:    {
      type: [Number],
      default: [2023, 2024, 2025],
    },
    taxRefundRequiredKycTier:  { type: Number, default: 2, min: 1, max: 3 },
    taxRefundHoldDays:         { type: Number, default: 3, min: 0 },
    // Card settings
    cardApplicationFee:    { type: Number, default: 0, min: 0 },
    cardPhysicalFee:       { type: Number, default: 0, min: 0 },
    cardMaxPerUser:        { type: Number, default: 5, min: 1, max: 20 },
    cardRequiredKycTier:   { type: Number, default: 1, min: 1, max: 3 },
    // Contact / support details (shown on public + user pages)
    supportPhone:          { type: String, default: "1-800-123-4567", trim: true },
    supportTextPhone:      { type: String, default: "", trim: true },
    supportEmail:          { type: String, default: "", trim: true },
    supportAddress:        { type: String, default: "Friedrichstraße 123, 10117 Berlin, Germany", trim: true },
    supportOffices:        {
      type: [SupportOfficeSchema],
      default: [
        { city: "Berlin",    type: "Headquarters",     addressLine1: "Friedrichstraße 123",   addressLine2: "10117 Berlin, Germany",             phone: "+49 30 1234 5678" },
        { city: "Frankfurt", type: "Financial Center", addressLine1: "Mainzer Landstraße 45",  addressLine2: "60329 Frankfurt am Main, Germany",  phone: "+49 69 9876 5432" },
        { city: "Munich",    type: "Regional Office",  addressLine1: "Maximilianstraße 78",    addressLine2: "80539 München, Germany",            phone: "+49 89 5555 1234" },
      ],
    },
    supportDepartments:    {
      type: [SupportDepartmentSchema],
      default: [
        { name: "General Support",  description: "Account questions, technical issues, general inquiries", email: "" },
        { name: "Business Banking", description: "Business accounts, commercial services, partnerships",   email: "" },
        { name: "Media & Press",    description: "Press inquiries, media requests, public relations",       email: "" },
      ],
    },
    // Specialised inbox addresses (legal / careers pages). Blank → main support email.
    careersEmail:          { type: String, default: "", trim: true },
    complianceEmail:       { type: String, default: "", trim: true },
    privacyEmail:          { type: String, default: "", trim: true },
    legalEmail:            { type: String, default: "", trim: true },
    // Per-service dashboard config
    loansService: {
      enabled:     { type: Boolean, default: true },
      status:      { type: String, enum: ["available", "restricted", "coming_soon", "maintenance", "disabled"], default: "available" },
      statusLabel: { type: String, default: "Available" },
      description: { type: String, default: "Quick approval process" },
    },
    grantsService: {
      enabled:     { type: Boolean, default: true },
      status:      { type: String, enum: ["available", "restricted", "coming_soon", "maintenance", "disabled"], default: "available" },
      statusLabel: { type: String, default: "Available" },
      description: { type: String, default: "Financial assistance programs" },
    },
    taxRefundsService: {
      enabled:     { type: Boolean, default: true },
      status:      { type: String, enum: ["available", "restricted", "coming_soon", "maintenance", "disabled"], default: "available" },
      statusLabel: { type: String, default: "Available" },
      description: { type: String, default: "Fast processing" },
    },
    cardsService: {
      enabled:     { type: Boolean, default: true },
      status:      { type: String, enum: ["available", "restricted", "coming_soon", "maintenance", "disabled"], default: "available" },
      statusLabel: { type: String, default: "Available" },
      description: { type: String, default: "Virtual & physical cards" },
    },
    // International transfer verification codes
    transferCodes: {
      imfCode: {
        enabled: { type: Boolean, default: false },
        code:    { type: String, default: "" },
        message: { type: String, default: "Your transaction requires IMF verification. Please enter the IMF Code provided by your account manager to proceed with this international transfer." },
        label:   { type: String, default: "IMF Code" },
      },
      swiftCode: {
        enabled: { type: Boolean, default: false },
        code:    { type: String, default: "" },
        message: { type: String, default: "SWIFT network verification is required for this international transfer. Please enter your SWIFT verification code to continue." },
        label:   { type: String, default: "SWIFT Code" },
      },
      imfClearanceCode: {
        enabled: { type: Boolean, default: false },
        code:    { type: String, default: "" },
        message: { type: String, default: "IMF Clearance is required for transfers of this amount. Please enter your IMF Clearance Code to authorize this transaction." },
        label:   { type: String, default: "IMF Clearance Code" },
      },
      taxCode: {
        enabled: { type: Boolean, default: false },
        code:    { type: String, default: "" },
        message: { type: String, default: "Tax verification is required for this international transfer. Please enter your Tax Code to comply with international tax regulations." },
        label:   { type: String, default: "TAX Code" },
      },
    },
    updatedBy:                { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    // Manage updatedAt manually so we can set it on upsert without timestamps creating _id conflicts
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
)

const AppSettings: Model<IAppSettings> =
  (mongoose.models.AppSettings as Model<IAppSettings>) ??
  mongoose.model<IAppSettings>("AppSettings", AppSettingsSchema)

export default AppSettings
