
import React, { useState, ReactNode, useCallback } from 'react';
import { 
    User, Account, Transaction, AppNotification, 
    News,
    Card, Contact, ShareRequest, LootBox, CardDesign, TaxConfig, UserSubscription, Company,
    SubscriptionPlan, Employee
} from '../types';
import { BANK_IBAN } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { BankContext } from './useBank';

export const BankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string>(() => localStorage.getItem('sids_active_account') || '');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [marketDesigns, setMarketDesigns] = useState<{ store: CardDesign[], inventory: CardDesign[] }>({ store: [], inventory: [] });
  const [taxConfig] = useState<TaxConfig>({ transferRate: 0.01, lotteryRate: 15 });
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);

  const setActiveAccountId = (id: string) => { setActiveAccountIdState(id); localStorage.setItem('sids_active_account', id); };

  const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (pattern) {
            case 'light': navigator.vibrate(5); break;
            case 'medium': navigator.vibrate(15); break;
            case 'heavy': navigator.vibrate(30); break;
            case 'success': navigator.vibrate([10, 30, 10]); break;
            case 'error': navigator.vibrate([30, 50, 30, 50, 30]); break;
        }
    }
  };

  const apiCall = async (body: any) => {
    try {
        const res = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const text = await res.text();
        
        if (!text) {
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            return {};
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON:", text, parseError);
            throw new Error(`Respuesta del servidor no es válida. Código: ${res.status}`, { cause: parseError });
        }

        if (!res.ok) throw new Error(data.error || 'Fallo SIDS');
        return data;
    } catch (error: any) { 
        console.error("API Error:", error); 
        throw error; 
    }
  };

  const fetchData = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const data = await apiCall({ action: 'GET_INITIAL_DATA', userId });
      setUserAccounts(data.accounts || []);
      if (data.accounts?.length > 0 && !activeAccountId) setActiveAccountId(data.accounts[0].id);
      setTransactions(data.transactions || []);
      setNews(data.news || []);
      setCompanies(data.companies || []);
      setCards(data.cards || []);
      setContacts(data.contacts || []);
      setShareRequests(data.shareRequests || []);
      setLootBoxes(data.lootBoxes || []);
      setMarketDesigns(data.marketDesigns || { store: [], inventory: [] });
      setUserSubscriptions(data.subscriptions || []);
    } catch (error) { console.error("Load error:", error); }
  }, [activeAccountId]);

  const login = async (dip: string, pass: string) => {
    const data = await apiCall({ action: 'AUTH', dip, password: pass });
    if (data.user) { setCurrentUser(data.user); await fetchData(data.user.id); return { success: true }; }
    return { success: false, error: "Credenciales inválidas" };
  };

  const loginWithPlacetaID = async (userData: any) => {
    const data = await apiCall({ action: 'AUTH_PLACETAID', userData });
    if (data.user) { setCurrentUser(data.user); await fetchData(data.user.id); return { success: true }; }
    return { success: false, error: "Usuario no registrado" };
  };

  const logout = () => { setCurrentUser(null); setUserAccounts([]); localStorage.removeItem('sids_active_account'); };

  const transfer = async (fromIban: string, toIban: string, amount: number, description: string, type = 'TRANSFER') => {
    await apiCall({ action: 'TRANSFER', fromIban, toIban, amount, description, type });
    if (currentUser?.id) await fetchData(currentUser.id);
  };

  const addNotification = (message: string, type: any) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const generatePDF = (type: string, data: any) => {
      const doc = new jsPDF() as any;
      const logoUrl = "https://i.postimg.cc/s2s2RdgX/BANCO-DE.png";

      doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 50, 'F');
      try { doc.addImage(logoUrl, 'PNG', 15, 12, 60, 20); } catch(err) { console.warn("Logo load failed", err); }

      doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("SIDS CENTRAL ADMINISTRATION", 195, 20, { align: 'right' });
      doc.setFontSize(8); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
      doc.text("DOCUMENTO OFICIAL PLACETA", 195, 26, { align: 'right' });
      doc.text(`FECHA: ${new Date().toLocaleString()}`, 195, 32, { align: 'right' });

      doc.setDrawColor(241, 245, 249); doc.line(15, 45, 195, 45);

      doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      const title = type.replace(/_/g, ' ');
      doc.text(title, 15, 65);

      if (type === 'RECIBO_NOMINA_INDIVIDUAL') {
          doc.setFillColor(250, 250, 250); doc.roundedRect(15, 75, 180, 120, 4, 4, 'F');
          doc.setFontSize(10); doc.setTextColor(100);
          doc.text("ENTIDAD EMISORA", 25, 85);
          doc.text("COLABORADOR / TRABAJADOR", 25, 110);
          doc.text("PERIODO DE LIQUIDACIÓN", 110, 110);
          
          doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
          doc.text(data.companyName, 25, 92);
          doc.text(data.employeeName, 25, 117);
          doc.text(data.period, 110, 117);

          autoTable(doc, {
              startY: 130,
              head: [['CONCEPTO', 'BASE (Pz)', 'RETENCIÓN', 'NETO (Pz)']],
              body: [[
                  'Salario Mensual Ordinario',
                  data.bruto.toLocaleString(),
                  `${data.rate}%`,
                  data.neto.toLocaleString()
              ]],
              theme: 'grid',
              headStyles: { fillColor: [15, 23, 42] }
          });

          doc.setFillColor(15, 23, 42); doc.roundedRect(120, 170, 75, 15, 2, 2, 'F');
          doc.setTextColor(255, 255, 255); doc.setFontSize(8);
          doc.text("TOTAL PERCIBIDO NETO", 125, 176);
          doc.setFontSize(11); doc.text(`${data.neto.toLocaleString()} Pz`, 125, 182);

      } else if (type === 'EXTRACTO_CUENTA' && Array.isArray(data.rows)) {
          autoTable(doc, { startY: 85, head: [['FECHA', 'CONCEPTO', 'MOVIMIENTO', 'SALDO']], body: data.rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
      } else if (type === 'RESUMEN_NOMINAS' && Array.isArray(data.rows)) {
          doc.text(`PLANILLA: ${data.metadata.companyName}`, 15, 80);
          autoTable(doc, { startY: 90, head: [['TRABAJADOR', 'IBAN', 'BRUTO', 'NETO', 'COSTE TOTAL']], body: data.rows, theme: 'grid', headStyles: { fillColor: [79, 70, 229] } });
      } else if (type === 'NOTIFICACION_PAGO_OFICIAL') {
          const tx = data.transaction;
          doc.setFillColor(250, 250, 250); doc.roundedRect(15, 80, 180, 80, 4, 4, 'F');
          doc.text(`ID: ${tx.id}`, 25, 90);
          doc.text(`Importe: ${tx.amount} Pz`, 25, 100);
          doc.text(`Concepto: ${tx.description}`, 25, 110);
      }

      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 30 : 210;
      doc.setFontSize(7); doc.setTextColor(180);
      doc.text("Este documento electrónico ha sido certificado por el Nodo Central del Banco de La Placeta bajo protocolo SIDS.", 105, finalY, { align: 'center' });
      doc.save(`BP_${type}_${Date.now()}.pdf`);
  };

  // Admin Methods...
  const adminGetSummary = () => apiCall({ action: 'ADMIN_GET_SUMMARY' });
  const adminGetUsers = () => apiCall({ action: 'ADMIN_GET_USERS' });
  const adminManageUser = (userId: string, updates: any) => apiCall({ action: 'ADMIN_MANAGE_USER', userId, ...updates });
  const adminCalcTaxes = (month: number, year: number) => apiCall({ action: 'ADMIN_CALC_TAXES', month, year });
  const adminPreviewTaxes = (month: number, year: number) => apiCall({ action: 'ADMIN_PREVIEW_TAXES', month, year });
  const adminGetInvoices = () => apiCall({ action: 'GET_INVOICES', role: 'ADMIN' });
  const adminGetRaffles = () => apiCall({ action: 'ADMIN_GET_RAFFLES' });
  const adminManageRaffle = (id: string, status: string) => apiCall({ action: 'ADMIN_MANAGE_RAFFLE', id, status });
  const adminGetProducts = () => apiCall({ action: 'ADMIN_GET_PRODUCTS' });
  const adminRevertTransaction = (txId: string) => apiCall({ action: 'ADMIN_REVERT_TRANSACTION', txId });
  const adminGetAuditLogs = () => apiCall({ action: 'GET_API_AUDIT_LOGS' });
  const adminCreateNews = (newsData: any) => apiCall({ action: 'ADMIN_CREATE_NEWS', ...newsData });
  const adminDeleteNews = (id: string) => apiCall({ action: 'ADMIN_DELETE_NEWS', id });

  // Business Methods...
  const payPayroll = async (companyId: string, month: string, year: string, singleEmployeeId?: string) => {
      const res = await apiCall({ action: 'PAY_PAYROLL', companyId, month, year, singleEmployeeId });
      if (currentUser?.id) await fetchData(currentUser.id);
      return res;
  };
  
  const updateEmployees = async (companyId: string, employees: Employee[]) => {
      await apiCall({ action: 'UPDATE_EMPLOYEES', companyId, employees });
      if (currentUser?.id) await fetchData(currentUser.id);
  };
  const updateCatalog = (companyId: string, catalog: any) => apiCall({ action: 'UPDATE_CATALOG', companyId, catalog });
  const goPublic = (companyId: string) => apiCall({ action: 'GO_PUBLIC', companyId });

  const getFiscalProjection = (month: number, year: number) => apiCall({ action: 'GET_FISCAL_PROJECTION', userId: currentUser?.id, month, year });
  const payCitizenTax = async (accountId: string, amount: number, description: string) => { 
      const acc = userAccounts.find(a=>a.id===accountId);
      if (acc) await transfer(acc.iban, BANK_IBAN, amount, description, 'TAX'); 
  };

  const requestCard = (accountId: string, holderName: string, design: string, pin: string) => apiCall({ action: 'REQUEST_CARD', accountId, holderName, design, pin });
  const toggleCardStatus = (cardId: string) => apiCall({ action: 'TOGGLE_CARD_STATUS', cardId });
  const linkAccountToCompany = (accountId: string, companyId: string) => apiCall({ action: 'LINK_ACCOUNT_TO_COMPANY', accountId, companyId });
  const saveContact = (name: string, iban: string) => apiCall({ action: 'SAVE_CONTACT', userId: currentUser?.id, name, iban });
  const deleteContact = (id: string) => apiCall({ action: 'DELETE_CONTACT', id });
  const buyStock = (companyId: string, accountId: string, amount: number) => apiCall({ action: 'BUY_STOCK', userId: currentUser?.id, companyId, accountId, amount });
  const sellStock = (companyId: string, accountId: string, amount: number) => apiCall({ action: 'SELL_STOCK', userId: currentUser?.id, companyId, accountId, amount });
  const respondShareRequest = (id: string, status: string) => apiCall({ action: 'RESPOND_SHARE_REQUEST', id, status });
  const requestShareAccount = (accountId: string, toUserDip: string, accessLevel: string) => apiCall({ action: 'REQUEST_SHARE_ACCOUNT', accountId, fromUserId: currentUser?.id, toUserDip, accessLevel });
  const buyLootBox = (boxId: string, accountId: string) => apiCall({ action: 'BUY_LOOTBOX', userId: currentUser?.id, boxId, accountId });
  const redeemCode = (code: string) => apiCall({ action: 'REDEEM_CODE', userId: currentUser?.id, code });
  const payWithCard = (cardInfo: any, amount: number, companyId: string, description: string) => apiCall({ action: 'PAY_WITH_CARD', cardInfo, amount, companyId, description });
  const subscribeToPlan = (plan: SubscriptionPlan, accountId: string) => apiCall({ action: 'SUBSCRIBE_TO_PLAN', userId: currentUser?.id, planId: plan.id, accountId });
  const cancelSubscription = (subId: string) => apiCall({ action: 'CANCEL_SUBSCRIPTION', subId });
  const buyDesign = (designId: string, accountId: string) => apiCall({ action: 'BUY_DESIGN', userId: currentUser?.id, designId, accountId });
  const listDesign = (designId: string, price: number) => apiCall({ action: 'LIST_DESIGN', designId, price });
  const deleteDesign = (designId: string) => apiCall({ action: 'DELETE_DESIGN', designId });

  const getMessages = (otherId: string) => apiCall({ action: 'GET_MESSAGES', userId: currentUser?.id, otherId });
  const sendMessage = (receiverId: string, content: string) => apiCall({ action: 'SEND_MESSAGE', senderId: currentUser?.id, receiverId, content });

  return (
    <BankContext.Provider value={{
      currentUser, userAccounts, transactions, notifications, news, companies,
      apiCredentials: [], auditLogs: [], cards, contacts, shareRequests, lootBoxes, marketDesigns, taxConfig, userSubscriptions,
      activeAccountId, setActiveAccountId,
      login, loginWithPlacetaID, logout, fetchData, transfer, addNotification, generatePDF, 
      getAge: (birthDate) => {
        if (!birthDate) return 18;
        const birth = new Date(birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        return age;
      }, 
      triggerHaptic,
      updateSelfBirthDate: async (b) => {
          await apiCall({ action: 'ADMIN_MANAGE_USER', userId: currentUser?.id, birthDate: b });
          if (currentUser?.id) await fetchData(currentUser.id);
      },
      claimRbu: async (accountId: string) => {
          await apiCall({ action: 'CLAIM_RBU', userId: currentUser?.id, accountId });
          if (currentUser?.id) await fetchData(currentUser.id);
      },
      adminGetSummary, adminGetUsers, adminManageUser, adminCalcTaxes, adminPreviewTaxes, adminGetInvoices,
      adminGetRaffles, adminManageRaffle, adminGetProducts, adminRevertTransaction, adminGetAuditLogs,
      adminCreateNews, adminDeleteNews,
      getFiscalProjection, payCitizenTax, requestCard, toggleCardStatus, linkAccountToCompany,
      saveContact, deleteContact, buyStock, sellStock, respondShareRequest, requestShareAccount,
      buyLootBox, redeemCode, payWithCard, subscribeToPlan, cancelSubscription, buyDesign, listDesign, deleteDesign,
      payPayroll, updateEmployees, updateCatalog, goPublic,
      getMessages, sendMessage
    }}>
      {children}
    </BankContext.Provider>
  );
};

