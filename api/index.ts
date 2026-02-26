
import { Pool } from '@neondatabase/serverless';

let pool: any = null;
const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
    pool = new (Pool as any)({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
};

const formatResponse = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(formatResponse);
    if (typeof obj !== 'object') return obj;
    const newObj: any = {};
    for (const key in obj) {
        const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        let value = obj[key];
        const numericFields = [
            'balance', 'amount', 'price', 'capital', 'stockValue', 'salary', 
            'tax', 'prizeValue', 'probability', 'taxAmount', 'ia', 
            'spendingLimit', 'maxPrice', 'taxRate', 'prizePool', 'ticketPrice', 'revenue'
        ];
        if (numericFields.includes(newKey) && (typeof value === 'string' || value === null)) {
            value = parseFloat(value || '0');
        }
        newObj[newKey] = formatResponse(value);
    }
    return newObj;
};

// Helper para asegurar que un campo JSON de DB sea un objeto/array real y no un string
const parseDBJson = (field: any, fallback: any = []) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
        const parsed = JSON.parse(field);
        // Si hay doble stringify (común en migraciones manuales), parseamos de nuevo
        if (typeof parsed === 'string') return JSON.parse(parsed);
        return parsed;
    } catch {
        return fallback;
    }
};

const getLimitsByAge = (birthDate: string | null, role: string) => {
    if (role === 'COMPANY' || role === 'ADMIN' || role === 'STATE') {
        return { type: 'Institucional', maxBalance: 10000000, dailyLimit: Infinity };
    }
    if (!birthDate) return { type: 'Ciudadana plena', maxBalance: 500000, dailyLimit: Infinity };
    
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

    if (age < 16) return { type: 'Junior básica', maxBalance: 500, dailyLimit: 50 };
    if (age < 18) return { type: 'Junior senior', maxBalance: 1000, dailyLimit: 100 };
    return { type: 'Ciudadana plena', maxBalance: 500000, dailyLimit: Infinity };
};

const getPayrollTaxRate = (salary: number) => {
    if (salary <= 1700) return 0.075;
    if (salary <= 3000) return 0.105;
    return 0.175;
};

export default async function handler(req: any, res: any) {
    let client: any;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, ...params } = req.body || {};
        client = await getPool().connect();

        // MIGRATIONS (Run on every request for simplicity in this environment, but ideally once)
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS rbu_claimed_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE;
        `);

        // 1. AUTENTICACIÓN Y DATOS INICIALES
        if (action === 'AUTH') {
            const userRes = await client.query("SELECT * FROM users WHERE UPPER(dip) = $1 AND password_hash = $2", [params.dip.toUpperCase(), params.password]);
            if (userRes.rows.length === 0) return res.status(401).json({ error: "Credenciales de nodo incorrectas" });
            
            const user = userRes.rows[0];
            
            // Welcome Bonus Logic
            if (!user.welcome_bonus_claimed) {
                await client.query("BEGIN");
                const personalAcc = await client.query("SELECT * FROM accounts WHERE owner_id = $1 AND type = 'PERSONAL' LIMIT 1", [user.id]);
                if (personalAcc.rows.length > 0) {
                    const iban = personalAcc.rows[0].iban;
                    const BANK_IBAN = 'PL0000000000000000000000'; // Assuming this is the bank's IBAN
                    await client.query("UPDATE accounts SET balance = balance + 500 WHERE iban = $1", [iban]);
                    await client.query("INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
                        [`BONUS-${Date.now()}`, 500, BANK_IBAN, iban, 'Bono de Bienvenida La Placeta', 'BONUS']);
                    await client.query("UPDATE users SET welcome_bonus_claimed = TRUE WHERE id = $1", [user.id]);
                    await client.query("COMMIT");
                    user.welcome_bonus_claimed = true;
                } else {
                    await client.query("ROLLBACK");
                }
            }

            return res.status(200).json({ success: true, user: formatResponse(user) });
        }

        if (action === 'AUTH_PLACETAID') {
            const { userData } = params;
            const dip = (userData.dni || userData.dip || userData.id || '').toUpperCase();
            if (!dip) return res.status(400).json({ error: "Datos de identidad inválidos" });
            const userRes = await client.query("SELECT * FROM users WHERE UPPER(dip) = $1", [dip]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: "Identidad validada por La Placeta pero no registrada en el Banco." });
            
            const user = userRes.rows[0];
             // Welcome Bonus Logic for PlacetaID too
             if (!user.welcome_bonus_claimed) {
                await client.query("BEGIN");
                const personalAcc = await client.query("SELECT * FROM accounts WHERE owner_id = $1 AND type = 'PERSONAL' LIMIT 1", [user.id]);
                if (personalAcc.rows.length > 0) {
                    const iban = personalAcc.rows[0].iban;
                    const BANK_IBAN = 'PL0000000000000000000000';
                    await client.query("UPDATE accounts SET balance = balance + 500 WHERE iban = $1", [iban]);
                    await client.query("INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
                        [`BONUS-${Date.now()}`, 500, BANK_IBAN, iban, 'Bono de Bienvenida La Placeta', 'BONUS']);
                    await client.query("UPDATE users SET welcome_bonus_claimed = TRUE WHERE id = $1", [user.id]);
                    await client.query("COMMIT");
                    user.welcome_bonus_claimed = true;
                } else {
                    await client.query("ROLLBACK");
                }
            }

            return res.status(200).json({ success: true, user: formatResponse(user) });
        }

        if (action === 'GET_INITIAL_DATA') {
            const { userId } = params;
            const accounts = await client.query("SELECT * FROM accounts WHERE owner_id = $1 OR $1 = ANY(shared_with)", [userId]);
            const ibans = accounts.rows.map((a:any)=>a.iban);
            let txs = { rows: [] };
            if (ibans.length > 0) {
                txs = await client.query("SELECT * FROM transactions WHERE sender_iban = ANY($1) OR receiver_iban = ANY($1) ORDER BY date DESC LIMIT 100", [ibans]);
            }
            const news = await client.query("SELECT * FROM news WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 10");
            
            // Fetch companies and manually parse JSON fields to ensure they are Arrays in the JSON response
            const companiesRaw = await client.query("SELECT * FROM companies"); 
            const companiesProcessed = companiesRaw.rows.map((c: any) => ({
                ...c,
                employees: parseDBJson(c.employees, []),
                catalog: parseDBJson(c.catalog, { active: true, products: [] }),
                shareholders: parseDBJson(c.shareholders, []),
                price_history: parseDBJson(c.price_history, [])
            }));

            const cards = await client.query("SELECT * FROM cards WHERE account_id = ANY($1)", [accounts.rows.map((a:any)=>a.id)]);
            const contacts = await client.query("SELECT * FROM contacts WHERE user_id = $1", [userId]);
            const shareRequests = await client.query("SELECT * FROM share_requests WHERE to_user_dip = (SELECT dip FROM users WHERE id = $1) OR from_user_id = $1", [userId]);
            const subs = await client.query("SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'ACTIVE'", [userId]);
            const lootBoxes = await client.query("SELECT * FROM loot_boxes");
            const designs = await client.query("SELECT * FROM card_designs");

            return res.status(200).json(formatResponse({ 
                accounts: accounts.rows || [], 
                transactions: txs.rows || [], 
                news: news.rows || [],
                companies: companiesProcessed || [],
                cards: cards.rows || [],
                contacts: contacts.rows || [],
                shareRequests: shareRequests.rows || [],
                subscriptions: subs.rows || [],
                lootBoxes: lootBoxes.rows || [],
                marketDesigns: {
                    store: designs.rows || [],
                    inventory: (designs.rows || []).filter((d:any) => d.owner_id === userId)
                }
            }));
        }

        // 2. OPERACIONES BANCARIAS
        if (action === 'TRANSFER') {
             const { fromIban, toIban, amount, description, type } = params;
             await client.query("BEGIN");
             const senderRes = await client.query("SELECT a.*, u.birth_date, u.role as user_role FROM accounts a JOIN users u ON a.owner_id = u.id WHERE a.iban = $1 FOR UPDATE", [fromIban]);
             if (senderRes.rows.length === 0) throw new Error("Cuenta origen no existe");
             const sender = senderRes.rows[0];
             
             const limits = getLimitsByAge(sender.birth_date, sender.user_role);
             
             // Check daily limit
             const todayTxs = await client.query("SELECT SUM(amount) FROM transactions WHERE sender_iban = $1 AND date > CURRENT_DATE", [fromIban]);
             const dailySpent = parseFloat(todayTxs.rows[0].sum || '0');
             if (dailySpent + amount > limits.dailyLimit) {
                 throw new Error(`Límite diario excedido para su franja de edad (${limits.dailyLimit} Pz)`);
             }

             if (parseFloat(sender.balance) < amount) throw new Error("Saldo insuficiente");
             
             const receiverRes = await client.query("SELECT a.*, u.birth_date, u.role as user_role FROM accounts a JOIN users u ON a.owner_id = u.id WHERE a.iban = $1", [toIban]);
             if (receiverRes.rows.length === 0) throw new Error("Cuenta destino no existe");
             const receiver = receiverRes.rows[0];
             
             const receiverLimits = getLimitsByAge(receiver.birth_date, receiver.user_role);
             if (parseFloat(receiver.balance) + amount > receiverLimits.maxBalance) {
                 throw new Error(`La cuenta destino excedería su límite de saldo (${receiverLimits.maxBalance} Pz)`);
             }
             
             await client.query("UPDATE accounts SET balance = balance - $1 WHERE iban = $2", [amount, fromIban]);
             await client.query("UPDATE accounts SET balance = balance + $1 WHERE iban = $2", [amount, toIban]);
             
             const id = `TX-${Date.now()}`;
             await client.query("INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, $6, NOW())", 
                 [id, amount, fromIban, toIban, description, type || 'TRANSFER']);
             
             await client.query("COMMIT");
             return res.status(200).json({ success: true });
        }

        if (action === 'CLAIM_RBU') {
            const { userId, accountId } = params;
            await client.query("BEGIN");
            const userRes = await client.query("SELECT * FROM users WHERE id = $1 FOR UPDATE", [userId]);
            if (userRes.rows.length === 0) throw new Error("Usuario no encontrado");
            const user = userRes.rows[0];

            // Check age for RBU exclusion (minors with parental control)
            const limits = getLimitsByAge(user.birth_date, user.role);
            if (limits.type === 'Junior básica') {
                throw new Error("Los menores con alta tutelada básica no perciben RBU.");
            }

            // Check if already claimed this week
            if (user.rbu_claimed_at) {
                const lastClaim = new Date(user.rbu_claimed_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastClaim.getTime());
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                if (diffDays < 7) {
                    throw new Error("Ya ha reclamado su RBU esta semana.");
                }
            }

            const accRes = await client.query("SELECT * FROM accounts WHERE id = $1 AND owner_id = $2", [accountId, userId]);
            if (accRes.rows.length === 0) throw new Error("Cuenta no válida para recibir RBU");
            const iban = accRes.rows[0].iban;

            const BANK_IBAN = 'PL0000000000000000000000';
            await client.query("UPDATE accounts SET balance = balance + 5 WHERE iban = $1", [iban]);
            await client.query("INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
                [`RBU-${Date.now()}`, 5, BANK_IBAN, iban, 'Renta Básica Universal Semanal', 'RBU']);
            
            await client.query("UPDATE users SET rbu_claimed_at = NOW() WHERE id = $1", [userId]);
            
            await client.query("COMMIT");
            return res.status(200).json({ success: true });
        }

        if (action === 'PAY_PAYROLL') {
            const { companyId, month, year, singleEmployeeId } = params;
            await client.query("BEGIN");
            
            const companyRes = await client.query("SELECT * FROM companies WHERE id = $1", [companyId]);
            if (companyRes.rows.length === 0) throw new Error("Sociedad no encontrada");
            const company = companyRes.rows[0];
            
            const allEmployees = parseDBJson(company.employees, []);
            let employeesToPay = allEmployees.filter((e:any) => e.status === 'ACTIVE' || !e.status); // Default to ACTIVE if missing
            
            if (singleEmployeeId) {
                employeesToPay = employeesToPay.filter((e:any) => e.id === singleEmployeeId);
            }
            
            if (employeesToPay.length === 0) throw new Error("No hay empleados activos seleccionados para el pago.");

            const STATE_TAX_IBAN = 'PL0000000000000000000000';

            // CÁLCULO DE TOTALES (Batch Optimization)
            let totalMassToDebit = 0;
            let totalTaxToState = 0;

            const processedList = employeesToPay.map((e: any) => {
                const salary = parseFloat(e.salary);
                const rate = getPayrollTaxRate(salary);
                const taxPart = salary * rate;
                const companyCost = salary + taxPart; // Lo que paga la empresa en total
                const totalTax = taxPart * 2; // Lo que va al estado (Retencion + SS)
                
                totalMassToDebit += companyCost;
                totalTaxToState += totalTax;

                return { ...e, salary, workerNet: salary - taxPart, totalTax, companyCost };
            });

            // Validar Fondos Totales
            const accRes = await client.query("SELECT balance, iban FROM accounts WHERE iban = $1 FOR UPDATE", [company.iban]);
            if (accRes.rows.length === 0) throw new Error("Cuenta corporativa principal no hallada.");
            
            const currentBalance = parseFloat(accRes.rows[0].balance);
            if (currentBalance < totalMassToDebit) {
                throw new Error(`Tesorería insuficiente. Saldo: ${currentBalance.toLocaleString()} Pz | Requerido: ${totalMassToDebit.toLocaleString()} Pz`);
            }

            // EJECUCIÓN OPTIMIZADA POR LOTES
            
            // 1. Cargo ÚNICO a la Empresa
            await client.query("UPDATE accounts SET balance = balance - $1 WHERE iban = $2", [totalMassToDebit, company.iban]);
            
            // 2. Abono ÚNICO a Hacienda
            await client.query("UPDATE accounts SET balance = balance + $1 WHERE iban = $2", [totalTaxToState, STATE_TAX_IBAN]);

            // 3. Distribución Individual (Solo abono a empleados + Logs)
            let index = 0;
            const now = Date.now();
            
            for(const emp of processedList) {
                index++;
                // Update Empleado
                await client.query("UPDATE accounts SET balance = balance + $1 WHERE iban = $2", [emp.workerNet, emp.iban]);

                const period = `${month}/${year}`;
                const txIdBase = `PAY-${now}-${index.toString().padStart(3, '0')}-${Math.floor(Math.random()*10000)}`;

                // Log Nómina
                await client.query(
                    "INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, 'PAYROLL', NOW())",
                    [txIdBase, emp.workerNet, company.iban, emp.iban, `Nómina ${period}: ${emp.name}`]
                );
                
                // Log Impuesto
                await client.query(
                    "INSERT INTO transactions (id, amount, sender_iban, receiver_iban, description, type, date) VALUES ($1, $2, $3, $4, $5, 'TAX', NOW())",
                    [txIdBase + '-TAX', emp.totalTax, company.iban, STATE_TAX_IBAN, `Tasas Laborales ${period}: ${emp.name}`]
                );
            }

            await client.query("COMMIT");
            return res.status(200).json({ success: true, count: processedList.length });
        }

        // 3. GESTIÓN ADMINISTRATIVA & SOPORTE
        if (action === 'ADMIN_CREATE_RAFFLE') {
            const { name, prizePool, ticketPrice, organizerId } = params;
            const id = 'RAFFLE-' + Date.now();
            await client.query(
                "INSERT INTO raffles (id, name, prize_pool, ticket_price, organizer_id, status, date) VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())",
                [id, name, prizePool, ticketPrice || 0, organizerId]
            );
            return res.status(200).json({ success: true, id });
        }

        if (action === 'GET_INVOICES') {
            const { userId, role } = params;
            let query = "SELECT * FROM invoices ORDER BY created_at DESC";
            let qParams: any[] = [];
            if (role !== 'ADMIN') {
                query = "SELECT i.* FROM invoices i JOIN companies c ON i.issuer_id = c.id WHERE c.owner_id = $1 ORDER BY i.created_at DESC";
                qParams = [userId];
            }
            const resInv = await client.query(query, qParams);
            return res.status(200).json(formatResponse(resInv.rows));
        }

        if (action === 'GET_NEWS') {
            const resNews = await client.query("SELECT * FROM news WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 20");
            return res.status(200).json(formatResponse(resNews.rows));
        }

        if (action === 'ADMIN_GET_SUMMARY') {
            const usersCount = await client.query("SELECT COUNT(*) FROM users");
            const balanceSum = await client.query("SELECT SUM(balance) FROM accounts");
            const txsToday = await client.query("SELECT COUNT(*) FROM transactions WHERE date > NOW() - INTERVAL '24 hours'");
            
            return res.status(200).json({
                totalUsers: parseInt(usersCount.rows[0].count),
                totalBalance: parseFloat(balanceSum.rows[0].sum || 0),
                txsToday: parseInt(txsToday.rows[0].count),
                moneyInCirculation: parseFloat(balanceSum.rows[0].sum || 0)
            });
        }

        if (action === 'ADMIN_GET_USERS') {
            const users = await client.query("SELECT * FROM users ORDER BY created_at DESC");
            return res.status(200).json(formatResponse(users.rows));
        }
        
        if (action === 'ADMIN_MANAGE_USER') {
            const { userId, ...updates } = params;
            const keys = Object.keys(updates);
            if (keys.length > 0) {
                const setString = keys.map((k, i) => `${k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${i+2}`).join(', ');
                await client.query(`UPDATE users SET ${setString} WHERE id = $1`, [userId, ...Object.values(updates)]);
            }
            return res.status(200).json({ success: true });
        }

        if (action === 'ADMIN_GET_ALL_TRANSACTIONS') {
            const txs = await client.query("SELECT * FROM transactions ORDER BY date DESC LIMIT 500");
            return res.status(200).json(formatResponse(txs.rows));
        }

        if (action === 'ADMIN_GET_RAFFLES') {
            const raffles = await client.query("SELECT r.*, u.name as organizer_name FROM raffles r LEFT JOIN users u ON r.organizer_id = u.id ORDER BY r.date DESC");
            return res.status(200).json(formatResponse(raffles.rows));
        }

        if (action === 'ADMIN_MANAGE_RAFFLE') {
            const { id, status } = params;
            await client.query("UPDATE raffles SET status = $1 WHERE id = $2", [status, id]);
            return res.status(200).json({ success: true });
        }

        if (action === 'ADMIN_REVERT_TRANSACTION') {
            const { txId } = params;
            await client.query("BEGIN");
            const txRes = await client.query("SELECT * FROM transactions WHERE id = $1", [txId]);
            if(txRes.rows.length === 0) throw new Error("Tx no encontrada");
            const tx = txRes.rows[0];
            if(tx.status === 'REVERTED') throw new Error("Ya revertida");

            await client.query("UPDATE accounts SET balance = balance + $1 WHERE iban = $2", [tx.amount, tx.sender_iban]);
            await client.query("UPDATE accounts SET balance = balance - $1 WHERE iban = $2", [tx.amount, tx.receiver_iban]);
            await client.query("UPDATE transactions SET status = 'REVERTED' WHERE id = $1", [txId]);
            
            await client.query("COMMIT");
            return res.status(200).json({ success: true });
        }

        if (action === 'UPDATE_EMPLOYEES') { 
            // Aseguramos que params.employees es un string JSON válido antes de guardar
            const employeesJson = typeof params.employees === 'string' ? params.employees : JSON.stringify(params.employees);
            await client.query("UPDATE companies SET employees = $1 WHERE id = $2", [employeesJson, params.companyId]); 
            return res.status(200).json({ success: true }); 
        }

        if (action === 'REQUEST_CARD') {
            const { accountId, holderName, design, pin } = params;
            const id = 'CARD-'+Date.now();
            const pan = Math.random().toString().slice(2,18);
            await client.query("INSERT INTO cards (id, account_id, pan, cvv, pin, holder_name, design, status, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', '12/30')", 
                [id, accountId, pan, '123', pin, holderName, design]);
            return res.status(200).json({ success: true });
        }

        if (action === 'SAVE_CONTACT') {
            const { userId, name, iban } = params;
            await client.query("INSERT INTO contacts (id, user_id, name, iban) VALUES ($1, $2, $3, $4)", [`C-${Date.now()}`, userId, name, iban]);
            return res.status(200).json({ success: true });
        }

        if (action === 'DELETE_CONTACT') {
            await client.query("DELETE FROM contacts WHERE id = $1", [params.id]);
            return res.status(200).json({ success: true });
        }

        // COMPARTIR CUENTA / FAMILIA
        if (action === 'REQUEST_SHARE_ACCOUNT') {
            const { accountId, fromUserId, toUserDip, accessLevel } = params;
            
            // Validate target user
            const targetUserRes = await client.query("SELECT * FROM users WHERE UPPER(dip) = $1", [toUserDip.toUpperCase()]);
            if (targetUserRes.rows.length === 0) throw new Error("El DIP destinatario no existe.");
            const targetUser = targetUserRes.rows[0];

            // Validate source user
            const sourceUserRes = await client.query("SELECT * FROM users WHERE id = $1", [fromUserId]);
            const sourceUser = sourceUserRes.rows[0];

            const id = 'REQ-' + Date.now();
            await client.query(
                "INSERT INTO share_requests (id, from_user_id, from_user_name, to_user_dip, to_user_name, account_id, access_level, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')",
                [id, fromUserId, sourceUser.name, targetUser.dip, targetUser.name, accountId, accessLevel]
            );
            return res.status(200).json({ success: true });
        }

        if (action === 'RESPOND_SHARE_REQUEST') {
            const { id, status } = params;
            await client.query("BEGIN");
            const reqRes = await client.query("SELECT * FROM share_requests WHERE id = $1", [id]);
            if (reqRes.rows.length === 0) throw new Error("Solicitud no encontrada");
            const request = reqRes.rows[0];

            await client.query("UPDATE share_requests SET status = $1 WHERE id = $2", [status, id]);

            if (status === 'ACCEPTED') {
                const userRes = await client.query("SELECT id FROM users WHERE dip = $1", [request.to_user_dip]);
                if (userRes.rows.length > 0) {
                    const userIdToAdd = userRes.rows[0].id;
                    // Actualizar array shared_with si no está ya
                    await client.query(
                        "UPDATE accounts SET shared_with = array_append(shared_with, $1) WHERE id = $2 AND NOT ($1 = ANY(shared_with))",
                        [userIdToAdd, request.account_id]
                    );
                }
            }
            await client.query("COMMIT");
            return res.status(200).json({ success: true });
        }

        // Placeholder para funciones fiscales
        if (action === 'GET_FISCAL_PROJECTION') {
            const { userId, month, year } = params;
            const accounts = await client.query("SELECT * FROM accounts WHERE owner_id = $1", [userId]);
            
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month
            const numDays = endDate.getDate();

            const projection = [];

            for (const acc of accounts.rows) {
                const txs = await client.query(
                    "SELECT * FROM transactions WHERE (sender_iban = $1 OR receiver_iban = $1) AND date >= $2 AND date <= $3 ORDER BY date DESC",
                    [acc.iban, startDate.toISOString(), endDate.toISOString()]
                );

                const currentBalance = parseFloat(acc.balance);
                const futureTxs = await client.query(
                    "SELECT SUM(CASE WHEN sender_iban = $1 THEN -amount ELSE amount END) as diff FROM transactions WHERE (sender_iban = $1 OR receiver_iban = $1) AND date > $2",
                    [acc.iban, endDate.toISOString()]
                );
                const diff = parseFloat(futureTxs.rows[0].diff || '0');
                const balanceAtEndOfMonth = currentBalance - diff;

                const dailyBalances = [];
                let runningBalance = balanceAtEndOfMonth;
                let txIndex = 0;

                for (let d = numDays; d >= 1; d--) {
                    const dayDate = new Date(year, month - 1, d, 23, 59, 59);
                    while (txIndex < txs.rows.length && new Date(txs.rows[txIndex].date) > dayDate) {
                        const tx = txs.rows[txIndex];
                        if (tx.sender_iban === acc.iban) runningBalance += parseFloat(tx.amount);
                        else runningBalance -= parseFloat(tx.amount);
                        txIndex++;
                    }
                    dailyBalances.push(runningBalance);
                }

                const patrimonioMedio = dailyBalances.reduce((a, b) => a + b, 0) / numDays;
                
                const income = txs.rows.filter((t:any) => t.receiver_iban === acc.iban).reduce((a:number, b:any) => a + parseFloat(b.amount), 0);
                const expenses = txs.rows.filter((t:any) => t.sender_iban === acc.iban).reduce((a:number, b:any) => a + parseFloat(b.amount), 0);
                
                const mediaIngresos = income / numDays;
                const mediaPagos = expenses / numDays;
                
                const ia = patrimonioMedio > 0 ? (mediaIngresos - mediaPagos) / patrimonioMedio : 0;

                let rate = 0;
                if (ia > 0) {
                    if (acc.type === 'PERSONAL') {
                        if (acc.shared_with && acc.shared_with.length > 0) {
                            if (ia <= 0.05) rate = 0.0075;
                            else if (ia <= 0.15) rate = 0.02;
                            else if (ia <= 0.30) rate = 0.04;
                            else rate = 0.06;
                        } else {
                            if (ia <= 0.05) rate = 0.005;
                            else if (ia <= 0.15) rate = 0.015;
                            else if (ia <= 0.30) rate = 0.03;
                            else rate = 0.05;
                        }
                    } else if (acc.type === 'BUSINESS' || acc.type === 'STATE') {
                        if (ia <= 0.05) rate = 0.01;
                        else if (ia <= 0.15) rate = 0.03;
                        else if (ia <= 0.30) rate = 0.06;
                        else rate = 0.09;
                    }
                }

                projection.push({
                    accountId: acc.id,
                    alias: acc.alias,
                    iban: acc.iban,
                    patrimonioMedio,
                    income,
                    expenses,
                    ia,
                    taxRate: rate,
                    taxAmount: patrimonioMedio * rate
                });
            }

            return res.status(200).json(formatResponse(projection));
        }

        // Fallback
        return res.status(400).json({ error: `Acción '${action}' no reconocida/implementada en API Gateway.` });

    } catch (e: any) {
        if (client) { try { await client.query("ROLLBACK"); } catch (err) { console.error("Rollback failed", err); } }
        console.error("API Error:", e);
        return res.status(500).json({ error: e.message || 'Error Interno del Servidor SIDS' });
    } finally {
        if (client) client.release();
    }
}
