// Single import point for all Mongoose models.
// Import the connection first so models are always registered against
// an initialised mongoose instance when this barrel is used server-side.

export { default as User } from "./User"
export type { IUser, IAddress, IPushSubscription, IPushSubscriptionKeys } from "./User"

export { default as Account } from "./Account"
export type { IAccount } from "./Account"

export { default as Transaction } from "./Transaction"
export type {
  ITransaction,
  IExternalRecipient,
  ITransactionMetadata,
  TransactionType,
  TransactionStatus,
  TransferType,
} from "./Transaction"

export { default as DepositRequest } from "./DepositRequest"
export type { IDepositRequest, DepositRequestStatus } from "./DepositRequest"

export { default as PaymentMethod } from "./PaymentMethod"
export type { IPaymentMethod, PaymentMethodType, DepositTarget } from "./PaymentMethod"

export { default as AppSettings, APP_SETTINGS_ID } from "./AppSettings"
export type { IAppSettings, ITransferCode, ITransferCodeSettings } from "./AppSettings"

export { default as KycDocument } from "./KycDocument"
export type { IKycDocument, KycDocType, KycDocStatus } from "./KycDocument"

export { default as LoanApplication } from "./LoanApplication"
export type { ILoanApplication, LoanStatus } from "./LoanApplication"

export { default as GrantApplication } from "./GrantApplication"
export type { IGrantApplication, GrantType, GrantStatus, IGrantDocument } from "./GrantApplication"

export { default as CardApplication } from "./CardApplication"
export type { ICardApplication, CardNetwork, CardType, CardStatus } from "./CardApplication"

export { default as Notification } from "./Notification"
export type {
  INotification,
  INotificationMetadata,
  NotificationType,
  NotificationChannel,
} from "./Notification"

export { default as AuditLog } from "./AuditLog"
export type { IAuditLog, IAuditPayload } from "./AuditLog"

export { default as SupportTicket } from "./SupportTicket"
export type {
  ISupportTicket,
  ITicketMessage,
  TicketStatus,
  TicketPriority,
  SenderRole,
} from "./SupportTicket"

export { default as Statement } from "./Statement"
export type { IStatement, StatementStatus, StatementFormat } from "./Statement"

export { default as Beneficiary } from "./Beneficiary"
export type { IBeneficiary, BeneficiaryType } from "./Beneficiary"
