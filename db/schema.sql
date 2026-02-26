
-- BANCO DE LA PLACETA - ESQUEMA INTEGRAL (v9.5 - Final Fix)

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dip TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'CITIZEN',
    verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    birth_date DATE,
    is_blocked BOOLEAN DEFAULT FALSE,
    spending_limit DECIMAL(20,2) DEFAULT 1000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS spending_limit DECIMAL(20,2) DEFAULT 1000000.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. Cuentas
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    iban TEXT UNIQUE NOT NULL,
    balance DECIMAL(20,2) DEFAULT 0.00,
    type TEXT DEFAULT 'PERSONAL',
    company_id TEXT,
    shared_with TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount DECIMAL(20,2) NOT NULL,
    sender_iban TEXT,
    receiver_iban TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    tax DECIMAL(20,2) DEFAULT 0.00,
    status TEXT DEFAULT 'COMPLETED',
    is_suspicious BOOLEAN DEFAULT FALSE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Empresas
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    nif TEXT UNIQUE,
    iban TEXT UNIQUE,
    capital DECIMAL(20,2) DEFAULT 0.00,
    stock_value DECIMAL(20,2) DEFAULT 100.00,
    is_public BOOLEAN DEFAULT FALSE,
    catalog JSONB DEFAULT '{"active": true, "products": []}',
    employees JSONB DEFAULT '[]',
    shareholders JSONB DEFAULT '[]',
    price_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Noticias
CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    tag TEXT DEFAULT 'INFO',
    image_url TEXT,
    author_name TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number_serial SERIAL,
    issuer_id TEXT NOT NULL,
    receiver_iban TEXT NOT NULL,
    concept TEXT NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    tax_amount DECIMAL(20,2) DEFAULT 0.00,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Productos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(20,2) NOT NULL,
    description TEXT,
    is_regulated BOOLEAN DEFAULT FALSE,
    max_price DECIMAL(20,2),
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Sorteos
CREATE TABLE IF NOT EXISTS raffles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organizer_id TEXT NOT NULL REFERENCES users(id),
    prize_pool DECIMAL(20,2) NOT NULL,
    ticket_price DECIMAL(20,2) DEFAULT 0.00,
    status TEXT DEFAULT 'PENDING',
    winner_id TEXT,
    revenue DECIMAL(20,2) DEFAULT 0.00,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Histórico Fiscal
CREATE TABLE IF NOT EXISTS fiscal_records (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    total_income DECIMAL(20,2) DEFAULT 0.00,
    total_expenses DECIMAL(20,2) DEFAULT 0.00,
    ia_value DECIMAL(10,4) DEFAULT 0.0000,
    tax_applied DECIMAL(20,2) DEFAULT 0.00,
    status TEXT DEFAULT 'UNPAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tarjetas
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    pan TEXT UNIQUE,
    cvv TEXT,
    pin TEXT,
    holder_name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    design TEXT,
    expiry_date TEXT,
    type TEXT DEFAULT 'DEBIT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Contactos
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    iban TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Solicitudes de Compartición
CREATE TABLE IF NOT EXISTS share_requests (
    id TEXT PRIMARY KEY,
    from_user_id TEXT REFERENCES users(id),
    from_user_name TEXT,
    to_user_dip TEXT,
    to_user_name TEXT,
    account_id TEXT REFERENCES accounts(id),
    access_level TEXT DEFAULT 'READ_ONLY',
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Loot Boxes
CREATE TABLE IF NOT EXISTS loot_boxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(20,2) DEFAULT 0,
    color TEXT,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Diseños de Mercado
CREATE TABLE IF NOT EXISTS card_designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    rarity TEXT,
    price DECIMAL(20,2) DEFAULT 0,
    is_listed BOOLEAN DEFAULT FALSE,
    owner_id TEXT REFERENCES users(id),
    seller_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Planes de Suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(20,2) DEFAULT 0,
    billing_cycle TEXT,
    permanence_months INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Suscripciones de Usuario
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    plan_id TEXT REFERENCES subscription_plans(id),
    account_id TEXT,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    permanence_end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Auditoría Admin
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Mensajes (Opcional, para evitar errores si se implementa mensajería)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    receiver_id TEXT,
    content TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices para Optimización SIDS
CREATE INDEX IF NOT EXISTS idx_user_dip ON users(dip);
CREATE INDEX IF NOT EXISTS idx_acc_iban ON accounts(iban);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_news_pub ON news(is_published, published_at);
