export interface Category { id:number; name:string; slug:string; icon_name:string; is_staff_only:boolean; suggested_providers:string[]; sort_order:number; }
export interface Profile { id:number; name:string; alias:string; category_slug:string; is_recurring:boolean; recurrence_cycle:string; default_amount:number|null; default_currency:string; default_vault_code:string; is_active:boolean; is_favorite:boolean; }
export interface Operation { id:number; profile_name:string; expense_category_name:string|null; amount:number; currency:string; vault_name:string|null; provider_info:string; invoice_number:string; created_by_name:string|null; status:string; created_at:string; total_invoice_amount:number|null; current_paid_amount:number|null; payment_date:string|null; exchange_rate_at_transaction:number|null; }
export interface CurrencyTotal { currency:string; total:number; count:number; }
export interface Summary { total_month:number; pending_count:number; total_operations:number; currency_totals:CurrencyTotal[]; available_currencies:string[]; consolidated_ves:number; upcoming_recurring:Profile[]; }
export interface OpDetail { id:number; profile_name:string; amount:number; currency:string; vault_name:string|null; vault_code:string|null; expense_category_name:string|null; provider_info:string; invoice_number:string; observations:string; attachment:string|null; created_by_name:string|null; status:string; total_invoice_amount:number|null; current_paid_amount:number|null; payment_date:string|null; created_at:string; exchange_rate_at_transaction:number|null; debts:Debt[]; payments:Payment[]; }
export interface Debt { id:number; provider_name:string; total_amount:number; paid_amount:number; remaining_amount:number; currency:string; is_paid:boolean; due_date:string|null; created_at:string; }
export interface Payment { id:number; debt_id:number; amount_paid:number; payment_currency:string; exchange_rate_at_payment:number|null; converted_amount:number|null; paid_by:string; payment_date:string; vault_name:string; comment:string; created_by_name:string; created_at:string; }

export const BAR_COLORS:Record<string,{bar:string,wrap:string,icon:string}> = {
  USD:{bar:'from-emerald-400 via-emerald-500 to-emerald-600',wrap:'ring-emerald-100 bg-emerald-50 dark:ring-emerald-500/20 dark:bg-emerald-500/10',icon:'text-emerald-600 dark:text-emerald-400'},
  VES:{bar:'from-blue-400 via-blue-500 to-blue-600',wrap:'ring-blue-100 bg-blue-50 dark:ring-blue-500/20 dark:bg-blue-500/10',icon:'text-blue-600 dark:text-blue-400'},
};
export const DEFAULT_BAR = {bar:'from-slate-400 to-slate-500',wrap:'ring-slate-100 bg-slate-50 dark:ring-slate-500/20 dark:bg-slate-500/10',icon:'text-slate-600 dark:text-slate-400'};
export const CAT_BAR_COLORS:Record<string,string> = { SERVICES:'#3B82F6', MERCHANDISE:'#10B981', PAYROLL:'#8B5CF6', MAINTENANCE:'#F59E0B', TAXES:'#EF4444', EFECTIVO360:'#06B6D4', OTHER:'#94A3B8' };

export function sym(c:string){return c==='USD'?'$':'Bs.';}
export function timeAgo(d:string):string{const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<60)return`hace ${m} min`;const h=Math.floor(m/60);return h<24?`hace ${h}h`:`hace ${Math.floor(h/24)}d`;}
export function bc(c:string){return BAR_COLORS[c]||DEFAULT_BAR;}
