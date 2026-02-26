
import { TaxRecord, ServiceProvider } from './types';

// Los datos de usuario y sistema se cargan dinámicamente desde la API.
// Estas constantes quedan como referencia de tipos y límites legislativos del Capítulo 1.

export const SECURITY_THRESHOLD_AMOUNT = 100000; // Umbral para verificación PIN

// Central Bank IBAN for tax collection
export const BANK_IBAN = 'PL0000000000000000000000';

export const DEFAULT_SERVICE_PROVIDERS: ServiceProvider[] = [
    { id: 'b-1', name: 'Electricidad Placeta', category: 'Hogar', iconKey: 'ZAP', colorClass: 'bg-yellow-100 text-yellow-600', isActive: true, accountIban: 'PL-ELEC-001' },
    { id: 'b-2', name: 'Aguas Municipales', category: 'Hogar', iconKey: 'DROPLETS', colorClass: 'bg-blue-100 text-blue-600', isActive: true, accountIban: 'PL-AGUA-002' },
    { id: 'b-3', name: 'Teleco Fibra', category: 'Internet', iconKey: 'WIFI', colorClass: 'bg-purple-100 text-purple-600', isActive: true, accountIban: 'PL-NET-003' },
];

// Fix: Added missing PENDING_TAXES constant for ATM functionality
export const PENDING_TAXES: TaxRecord[] = [
    { id: 'tax-101', concept: 'IBI - Impuesto Bienes Inmuebles', amount: 450, dueDate: '2024-12-31', status: 'PENDING' },
    { id: 'tax-102', concept: 'Tasa de Basuras y Residuos', amount: 85, dueDate: '2024-11-15', status: 'PENDING' },
    { id: 'tax-103', concept: 'Impuesto Vehículos Tracción Mecánica', amount: 120, dueDate: '2025-01-20', status: 'PENDING' }
];
