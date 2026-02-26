

export type Role = 'USER' | 'ADMIN' | 'COMPANY';
export type AccountType = 'PERSONAL' | 'BUSINESS' | 'SAVINGS' | 'STATE';

export interface User {
    id: string;
    name: string;
    dip: string;
    avatarUrl?: string;
    role: Role;
    birthDate?: string;
    verified: boolean;
    isBlocked: boolean;
    spendingLimit: number;
    rbuClaimedAt?: string;
    welcomeBonusClaimed?: boolean;
}

export interface Account {
    id: string;
    ownerId: string;
    iban: string;
    alias: string;
    balance: number;
    type: AccountType;
    companyId?: string;
    sharedWith: string[];
    maxBalance?: number;
    dailyTransferLimit?: number;
    created_at?: string;
}

export interface Transaction {
    id: string;
    amount: number;
    senderIban: string;
    receiverIban: string;
    description: string;
    type: string;
    date: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERTED';
    tax: number;
    isSuspicious: boolean;
}

export interface Product {
    id: string;
    companyId: string;
    name: string;
    price: number;
    description?: string;
    isRegulated: boolean;
    maxPrice: number;
    taxRate: number;
}

export interface Raffle {
    id: string;
    name: string;
    organizerId: string;
    organizerName: string;
    date: string;
    prizePool: number;
    ticketPrice: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FINISHED';
    winnerId?: string;
    revenue: number;
}

export interface Invoice {
    id: string;
    numberSerial: number;
    issuerId: string;
    issuerName?: string;
    receiverIban: string;
    concept: string;
    amount: number;
    taxAmount: number;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    createdAt: string;
}

export interface FiscalRecord {
    id: string;
    userId: string;
    userName?: string;
    periodMonth: number;
    periodYear: number;
    totalIncome: number;
    totalExpenses: number;
    iaValue: number;
    taxApplied: number;
    status: 'UNPAID' | 'PAID' | 'EXEMPT';
}

export interface AppNotification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface ApiAuditLog {
    id: string;
    timestamp: string;
    credentialName: string;
    method: string;
    endpoint: string;
    statusCode: number;
    ipAddress: string;
}

export interface ApiCredential {
    id: string;
    name: string;
    clientId: string;
    secret: string;
    isGovInternal: boolean;
    isActive: boolean;
    companyId?: string;
}

export interface News {
    id: string;
    title: string;
    summary: string;
    content: string;
    tag: string;
    imageUrl: string;
    authorName: string;
    publishedAt: string;
}

export interface TaxRecord {
    id: string;
    concept: string;
    amount: number;
    dueDate: string;
    status: 'PENDING' | 'PAID';
}

export interface Investment {
    id: string;
    companyId: string;
    userId: string;
    shares: number;
    purchasePrice: number;
    date: string;
}

export interface InvestmentOption {
    id: string;
    name: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    expectedReturn: number;
}

export interface LinkedAccount {
    id: string;
    userId: string;
    accountIban: string;
    externalBank: string;
}

export interface Card {
    id: string;
    accountId: string;
    pan: string;
    cvv: string;
    pin: string;
    holderName: string;
    status: 'ACTIVE' | 'FROZEN';
    design?: string;
}

export interface LootBox {
    id: string;
    name: string;
    description: string;
    price: number;
    color?: string;
    availableFrom?: string;
    availableUntil?: string;
}

export interface LootItem {
    id: string;
    name: string;
    value: number;
}

export interface ServiceProvider {
    id: string;
    name: string;
    category: string;
    iconKey: string;
    colorClass: string;
    isActive: boolean;
    accountIban: string;
}

export interface Company {
    id: string;
    ownerId: string;
    name: string;
    nif: string;
    iban: string;
    capital: number;
    stockValue: number;
    isPublic: boolean;
    catalog: {
        active: boolean;
        products: Product[];
    };
    employees: Employee[];
    shareholders: { userId: string, shares: number }[];
    price_history?: any;
    subscriptionPlans?: SubscriptionPlan[];
}

export interface Employee {
    id: string;
    name: string;
    dip: string;
    role: string;
    salary: number;
    iban: string;
    hireDate: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    billingCycle: string;
    permanenceMonths: number;
}

export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    nextPaymentDate: string;
    permanenceEndDate?: string;
}

export interface CardDesign {
    id: string;
    name: string;
    imageUrl: string;
    rarity: string;
    price: number;
    isListed?: boolean;
    ownerId?: string;
    sellerName?: string;
}

export interface ShareRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserDip: string;
    toUserName: string;
    countId: string;
    accountId: string;
    accessLevel: 'READ_ONLY' | 'FULL_ACCESS';
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface Contact {
    id: string;
    name: string;
    iban: string;
}

export interface TaxConfig {
    transferRate: number;
    lotteryRate: number;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    read: boolean;
}

export interface BankContextType {
  currentUser: User | null;
  userAccounts: Account[];
  transactions: Transaction[];
  notifications: AppNotification[];
  companies: Company[];
  apiCredentials: ApiCredential[];
  auditLogs: ApiAuditLog[];
  news: News[];
  cards: Card[];
  contacts: Contact[];
  shareRequests: ShareRequest[];
  lootBoxes: LootBox[];
  marketDesigns: { store: CardDesign[], inventory: CardDesign[] };
  taxConfig: TaxConfig;
  userSubscriptions: UserSubscription[];
  
  // Global Selection State
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  
  login: (dip: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPlacetaID: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchData: (userId: string) => Promise<void>;
  transfer: (fromIban: string, toIban: string, amount: number, description: string, type?: string) => Promise<void>;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  generatePDF: (type: string, data: any) => void;
  getAge: (birthDate?: string) => number;
  triggerHaptic: (pattern?: 'light' | 'medium' | 'heavy' | 'success' | 'error') => void;
  updateSelfBirthDate: (birthDate: string) => Promise<void>;
  claimRbu: (accountId: string) => Promise<void>;
  
  // Admin Methods
  adminGetSummary: () => Promise<any>;
  adminGetUsers: () => Promise<User[]>;
  adminManageUser: (userId: string, data: Partial<User>) => Promise<void>;
  adminCalcTaxes: (month: number, year: number) => Promise<void>;
  // Fix: Added adminPreviewTaxes to the BankContextType interface
  adminPreviewTaxes: (month: number, year: number) => Promise<any>;
  adminGetInvoices: () => Promise<Invoice[]>;
  adminGetRaffles: () => Promise<Raffle[]>;
  adminManageRaffle: (id: string, status: string) => Promise<void>;
  adminGetProducts: () => Promise<Product[]>;
  adminRevertTransaction: (txId: string) => Promise<void>;
  adminGetAuditLogs: () => Promise<ApiAuditLog[]>;
  adminCreateNews: (newsData: any) => Promise<void>;
  adminDeleteNews: (id: string) => Promise<void>;
  
  // Shared
  getFiscalProjection: (month: number, year: number) => Promise<any[]>;
  payCitizenTax: (accountId: string, amount: number, description: string) => Promise<void>;
  requestCard: (accountId: string, holderName: string, design: string, pin: string) => Promise<void>;
  toggleCardStatus: (cardId: string) => Promise<void>;
  linkAccountToCompany: (accountId: string, companyId: string) => Promise<void>;
  saveContact: (name: string, iban: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  buyStock: (companyId: string, accountId: string, amount: number) => Promise<void>;
  sellStock: (companyId: string, accountId: string, amount: number) => Promise<void>;
  respondShareRequest: (id: string, status: string) => Promise<void>;
  requestShareAccount: (accountId: string, toUserDip: string, accessLevel: string) => Promise<void>;
  buyLootBox: (boxId: string, accountId: string) => Promise<{ success: boolean, wonItem?: LootItem }>;
  redeemCode: (code: string) => Promise<void>;
  payWithCard: (cardInfo: any, amount: number, companyId: string, description: string) => Promise<void>;
  subscribeToPlan: (plan: SubscriptionPlan, accountId: string) => Promise<void>;
  cancelSubscription: (subId: string) => Promise<void>;
  buyDesign: (designId: string, accountId: string) => Promise<void>;
  listDesign: (designId: string, price: number) => Promise<void>;
  deleteDesign: (designId: string) => Promise<void>;
  payPayroll: (companyId: string, month: string, year: string, singleEmployeeId?: string) => Promise<any>;
  updateEmployees: (companyId: string, employees: Employee[]) => Promise<void>;
  updateCatalog: (companyId: string, catalog: any) => Promise<void>;
  goPublic: (companyId: string) => Promise<void>;
  
  // Messaging
  getMessages: (otherId: string) => Promise<Message[]>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
}
