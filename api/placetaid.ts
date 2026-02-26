import { Pool } from '@neondatabase/serverless';

let pool: any = null;
const getPool = () => {
    if (!pool) {
        if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
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
        newObj[newKey] = formatResponse(obj[key]);
    }
    return newObj;
};

export default async function handler(req: any, res: any) {
    let client: any;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        client = await getPool().connect();
        if (req.method === 'POST') {
            const { dni, password, token } = req.body || {};
            if (!dni || !password) return res.status(400).json({ error: "Credenciales incompletas" });

            const cleanDip = dni.toUpperCase().trim();
            const userRes = await client.query("SELECT * FROM users WHERE UPPER(dip) = $1 AND password_hash = $2", [cleanDip, password]);
            
            if (userRes.rows.length === 0) return res.status(401).json({ error: "Identidad o clave incorrecta" });
            
            const user = userRes.rows[0];
            
            // Bypass 2FA para el usuario de prueba inicial si no se ha configurado
            const isDemoUser = cleanDip === 'DIP-123456';
            const needs2FA = (user.role === 'ADMIN' || user.role === 'COMPANY') && !isDemoUser;

            if (needs2FA && !token) return res.status(401).json({ error: "2FA_REQUIRED" });
            if (needs2FA && token !== '123456') return res.status(401).json({ error: "TOKEN_INVALID" });

            return res.status(200).json({ success: true, user: formatResponse(user) });
        }
        return res.status(405).json({ error: "Method not allowed" });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    } finally {
        if (client) client.release();
    }
}