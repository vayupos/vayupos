import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Store, Printer, Wifi, Monitor,
  RotateCw, CheckCircle, XCircle, Loader2, Copy, Key,
} from 'lucide-react';
import { getSettings, updateSettings, regenerateAgentKey } from '../api/settingsApi';
import { useToast } from '@/hooks/use-toast';

// ── Paper width options ─────────────────────────────────────────────────
const PAPER_WIDTHS = [
  { label: '58 mm  (small thermal)', value: '58' },
  { label: '76 mm  (medium thermal)', value: '76' },
  { label: '80 mm  (standard thermal)', value: '80' },
  { label: '85 mm  (wide thermal)', value: '85' },
  { label: 'Custom', value: 'custom' },
];

const PRINTER_TYPES = [
  {
    value: 'browser',
    label: 'Browser / USB',
    icon: Monitor,
    desc: 'Print via browser dialog — works with any USB printer connected to this device',
  },
  {
    value: 'wifi',
    label: 'WiFi / LAN',
    icon: Wifi,
    desc: 'Send directly to a WiFi/LAN thermal printer via the VayuPOS Print Agent',
  },
];

// ── Printer section (reused for Bill and KOT) ───────────────────────────
function PrinterSection({ title, prefix, form, setForm, onTestPrint, testStatus }) {
  const typeKey  = `${prefix}_printer_type`;
  const widthKey = `${prefix}_paper_width`;
  const ipKey    = `${prefix}_printer_ip`;
  const portKey  = `${prefix}_printer_port`;
  const [customWidth, setCustomWidth] = useState('');

  const isCustom    = !PAPER_WIDTHS.slice(0, -1).find(w => w.value === form[widthKey]);
  const printerType = form[typeKey] || 'browser';

  const handleWidthSelect = (val) => {
    if (val === 'custom') {
      setForm(f => ({ ...f, [widthKey]: customWidth || '72' }));
    } else {
      setForm(f => ({ ...f, [widthKey]: val }));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>

      {/* Connection type */}
      <div>
        <label className="block text-[13px] font-medium text-muted-foreground mb-3">Connection type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINTER_TYPES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(f => ({ ...f, [typeKey]: value }))}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                printerType === value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={printerType === value ? 'text-primary' : 'text-muted-foreground'} />
                <span className={`text-[14px] font-semibold ${printerType === value ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paper width */}
      <div>
        <label className="block text-[13px] font-medium text-muted-foreground mb-2">Paper width</label>
        <div className="flex flex-wrap gap-2">
          {PAPER_WIDTHS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleWidthSelect(value)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-medium transition-all ${
                (value === 'custom' ? isCustom : form[widthKey] === value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {isCustom && (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor={`${prefix}-custom-width`} className="sr-only">Custom paper width (mm)</label>
            <input
              id={`${prefix}-custom-width`}
              type="number"
              name={`${prefix}_custom_width`}
              autoComplete="off"
              min="40"
              max="120"
              value={customWidth || form[widthKey]}
              onChange={e => { setCustomWidth(e.target.value); setForm(f => ({ ...f, [widthKey]: e.target.value })); }}
              placeholder="e.g. 72"
              className="w-28 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-[13px] text-muted-foreground">mm</span>
          </div>
        )}
      </div>

      {/* WiFi settings */}
      {printerType === 'wifi' && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-[13px] text-muted-foreground">
            Enter your thermal printer's IP address and port. The VayuPOS Print Agent must be running on the same network.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${prefix}-printer-ip`} className="block text-[13px] font-medium text-muted-foreground mb-1">Printer IP</label>
              <input
                id={`${prefix}-printer-ip`}
                type="text"
                name={`${prefix}_printer_ip`}
                autoComplete="off"
                value={form[ipKey] || ''}
                onChange={e => setForm(f => ({ ...f, [ipKey]: e.target.value }))}
                placeholder="192.168.1.150"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor={`${prefix}-printer-port`} className="block text-[13px] font-medium text-muted-foreground mb-1">Port</label>
              <input
                id={`${prefix}-printer-port`}
                type="number"
                name={`${prefix}_printer_port`}
                autoComplete="off"
                value={form[portKey] || 9100}
                onChange={e => setForm(f => ({ ...f, [portKey]: parseInt(e.target.value) || 9100 }))}
                placeholder="9100"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Standard ESC/POS port is <strong>9100</strong>. Leave as-is if unsure.
          </p>
        </div>
      )}

      {/* Test print */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onTestPrint(prefix)}
          disabled={testStatus === 'loading'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-[14px] font-medium hover:bg-muted transition-all disabled:opacity-50"
        >
          {testStatus === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          Test print
        </button>
        {testStatus === 'success' && (
          <span className="flex items-center gap-1 text-[13px] text-green-600 dark:text-green-400">
            <CheckCircle size={14} /> Sent to printer
          </span>
        )}
        {testStatus === 'error' && (
          <span className="flex items-center gap-1 text-[13px] text-red-500">
            <XCircle size={14} /> Failed — check connection
          </span>
        )}
      </div>
    </div>
  );
}

// ── Print Agent Key section ─────────────────────────────────────────────
function AgentKeySection({ agentKey, onRegenerate }) {
  const { toast } = useToast();
  const [regenerating, setRegenerating] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(agentKey || '');
    toast({ title: 'Agent key copied' });
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate the agent key? The current key will stop working immediately.')) return;
    setRegenerating(true);
    try {
      await onRegenerate();
      toast({ title: 'New agent key generated' });
    } catch {
      toast({ title: 'Failed to regenerate key', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Key size={16} className="text-primary" />
        <h4 className="text-[14px] font-semibold text-foreground">Print Agent Key</h4>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Copy this key into the <code className="bg-muted px-1 rounded text-[12px]">agent_key</code> field
        in your VayuPOS Print Agent's <code className="bg-muted px-1 rounded text-[12px]">config.json</code>.
        Each restaurant has its own unique key — the agent will only fetch jobs for this restaurant.
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="s-agent-key" className="sr-only">Print agent key</label>
        <input
          id="s-agent-key"
          name="print_agent_key"
          autoComplete="off"
          readOnly
          value={agentKey || '—'}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-[13px] font-mono focus:outline-none"
        />
        <button
          type="button"
          onClick={copyKey}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-[13px] hover:bg-muted transition-all"
        >
          <Copy size={14} /> Copy
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-[13px] hover:bg-muted transition-all disabled:opacity-50"
        >
          {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
          Regenerate
        </button>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────
const TABS = ['Restaurant Info', 'Bill Printer', 'KOT Printer', 'Loyalty'];

const DEFAULT_FORM = {
  restaurant_name: '',
  owner_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  logo_url: '',
  currency_symbol: '₹',
  bill_header: '',
  bill_footer: 'Thank you for visiting! Please come again.',
  bill_printer_type: 'browser',
  bill_paper_width: '80',
  bill_printer_ip: '',
  bill_printer_port: 9100,
  kot_printer_type: 'wifi',
  kot_paper_width: '80',
  kot_printer_ip: '',
  kot_printer_port: 9100,
  print_agent_key: '',
  loyalty_point_value:    0.10,
  loyalty_earn_pct:       2.0,
  loyalty_min_redeem_pts: 100,
};

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [testStatus, setTestStatus] = useState({ bill: null, kot: null });

  useEffect(() => {
    getSettings()
      .then(res => setForm({ ...DEFAULT_FORM, ...res.data }))
      .catch(() => toast({ title: 'Could not load settings', variant: 'destructive' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSettings(form);
      setForm(prev => ({ ...prev, ...res.data }));
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    const res = await regenerateAgentKey();
    setForm(prev => ({ ...prev, print_agent_key: res.data.print_agent_key }));
  };

  const handleTestPrint = useCallback(async (prefix) => {
    setTestStatus(s => ({ ...s, [prefix]: 'loading' }));
    const type  = form[`${prefix}_printer_type`];
    const width = form[`${prefix}_paper_width`] || '80';

    try {
      if (type === 'browser') {
        const win   = window.open('', '_blank', 'width=400,height=600');
        const chars = Math.floor(parseInt(width) / 1.65);
        const line  = '-'.repeat(chars);
        win.document.write(`
          <html><head><style>
            body { font-family: monospace; font-size: ${parseInt(width) <= 58 ? '9px' : '11px'}; margin: 0; padding: 4mm; width: ${width}mm; }
            @media print { @page { size: ${width}mm auto; margin: 0; } }
          </style></head><body>
          <div style="text-align:center"><b>TEST PRINT</b><br>${form.restaurant_name || 'My Restaurant'}</div>
          <p>${line}</p>
          <p>Paper: ${width}mm | Type: ${type}</p>
          <p>Item 1 x 2 &nbsp;&nbsp;&nbsp; &#x20B9;200</p>
          <p>Item 2 x 1 &nbsp;&nbsp;&nbsp; &#x20B9;150</p>
          <p>${line}</p>
          <p style="text-align:right"><b>Total: &#x20B9;350</b></p>
          <p>${line}</p>
          <p style="text-align:center">${form.bill_footer || 'Thank you!'}</p>
          <script>window.onload=()=>{ window.print(); setTimeout(()=>window.close(),1000); }</script>
          </body></html>`);
        win.document.close();
        setTestStatus(s => ({ ...s, [prefix]: 'success' }));
      } else if (type === 'wifi') {
        if (!form[`${prefix}_printer_ip`]) throw new Error('No printer IP set');
        toast({
          title: `Test job queued for ${form[`${prefix}_printer_ip`]}:${form[`${prefix}_printer_port`] || 9100}`,
          description: 'Make sure the VayuPOS Print Agent is running.',
        });
        setTestStatus(s => ({ ...s, [prefix]: 'success' }));
      }
    } catch (err) {
      toast({ title: 'Test print failed', description: err.message, variant: 'destructive' });
      setTestStatus(s => ({ ...s, [prefix]: 'error' }));
    }

    setTimeout(() => setTestStatus(s => ({ ...s, [prefix]: null })), 4000);
  }, [form, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-bold text-foreground">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Restaurant Info ───────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Restaurant name" required htmlFor="s-restaurant-name">
              <input
                id="s-restaurant-name"
                name="restaurant_name"
                autoComplete="organization"
                value={form.restaurant_name}
                onChange={e => setForm(f => ({ ...f, restaurant_name: e.target.value }))}
                placeholder="Spice Garden"
                className={inputCls}
              />
            </Field>
            <Field label="Owner name" htmlFor="s-owner-name">
              <input
                id="s-owner-name"
                name="owner_name"
                autoComplete="name"
                value={form.owner_name || ''}
                onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                placeholder="Rajesh Kumar"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <input
                id="s-phone"
                name="phone"
                autoComplete="tel"
                value={form.phone || ''}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className={inputCls}
              />
            </Field>
            <Field label="Email" htmlFor="s-email">
              <input
                id="s-email"
                type="email"
                name="email"
                autoComplete="email"
                value={form.email || ''}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="owner@spicegarden.com"
                className={inputCls}
              />
            </Field>
            <Field label="City" htmlFor="s-city">
              <input
                id="s-city"
                name="city"
                autoComplete="address-level2"
                value={form.city || ''}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Hyderabad"
                className={inputCls}
              />
            </Field>
            <Field label="Currency symbol" htmlFor="s-currency">
              <input
                id="s-currency"
                name="currency_symbol"
                autoComplete="off"
                value={form.currency_symbol || '₹'}
                onChange={e => setForm(f => ({ ...f, currency_symbol: e.target.value }))}
                placeholder="₹"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address" htmlFor="s-address">
            <textarea
              id="s-address"
              name="address"
              autoComplete="street-address"
              value={form.address || ''}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Plot 12, Road No 5, Kukatpally, Hyderabad – 500072"
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </Field>
          <div className="border-t border-border pt-5 space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Bill text</h3>
            <Field label="Bill header" hint="Printed at the top of every bill (e.g. GSTIN, tagline)" htmlFor="s-bill-header">
              <textarea
                id="s-bill-header"
                name="bill_header"
                autoComplete="off"
                value={form.bill_header || ''}
                onChange={e => setForm(f => ({ ...f, bill_header: e.target.value }))}
                placeholder="GSTIN: 22AAAAA0000A1Z5"
                rows={2}
                className={inputCls + ' resize-none'}
              />
            </Field>
            <Field label="Bill footer" hint="Printed at the bottom of every bill" htmlFor="s-bill-footer">
              <textarea
                id="s-bill-footer"
                name="bill_footer"
                autoComplete="off"
                value={form.bill_footer || ''}
                onChange={e => setForm(f => ({ ...f, bill_footer: e.target.value }))}
                placeholder="Thank you for visiting! Please come again."
                rows={2}
                className={inputCls + ' resize-none'}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ── Tab 1: Bill Printer ──────────────────────────────────────── */}
      {activeTab === 1 && (
        <PrinterSection
          title="Bill / POS printer  (customer receipt)"
          prefix="bill"
          form={form}
          setForm={setForm}
          onTestPrint={handleTestPrint}
          testStatus={testStatus.bill}
        />
      )}

      {/* ── Tab 2: KOT Printer ──────────────────────────────────────── */}
      {activeTab === 2 && (
        <>
          <PrinterSection
            title="KOT printer  (kitchen)"
            prefix="kot"
            form={form}
            setForm={setForm}
            onTestPrint={handleTestPrint}
            testStatus={testStatus.kot}
          />
          <AgentKeySection
            agentKey={form.print_agent_key}
            onRegenerate={handleRegenerate}
          />
        </>
      )}

      {/* ── Tab 3: Loyalty ───────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="space-y-6 max-w-lg">
          <p className="text-[13px] text-muted-foreground">
            Configure how loyalty points are earned and redeemed across your restaurant.
          </p>
          <Field label="Points value (₹ per 1 point)" hint="How much cash value 1 loyalty point is worth. e.g. 0.10 means 10 pts = ₹1" htmlFor="s-loyalty-point-value">
            <input
              id="s-loyalty-point-value"
              type="number"
              name="loyalty_point_value"
              autoComplete="off"
              min="0.01"
              step="0.01"
              value={form.loyalty_point_value}
              onChange={e => setForm(f => ({ ...f, loyalty_point_value: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
              placeholder="0.10"
            />
          </Field>
          <Field label="Points earned per order (%)" hint="% of order total that becomes loyalty points. e.g. 2 means a ₹500 order earns 10 pts (500 × 2% = 10)" htmlFor="s-loyalty-earn-pct">
            <input
              id="s-loyalty-earn-pct"
              type="number"
              name="loyalty_earn_pct"
              autoComplete="off"
              min="0"
              step="0.1"
              max="100"
              value={form.loyalty_earn_pct}
              onChange={e => setForm(f => ({ ...f, loyalty_earn_pct: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
              placeholder="2.0"
            />
          </Field>
          <Field label="Minimum points to redeem" hint="Customer must have at least this many points before they can redeem" htmlFor="s-loyalty-min-redeem">
            <input
              id="s-loyalty-min-redeem"
              type="number"
              name="loyalty_min_redeem_pts"
              autoComplete="off"
              min="1"
              step="1"
              value={form.loyalty_min_redeem_pts}
              onChange={e => setForm(f => ({ ...f, loyalty_min_redeem_pts: parseInt(e.target.value) || 100 }))}
              className={inputCls}
              placeholder="100"
            />
          </Field>
          <div className="p-4 bg-muted/60 rounded-xl border border-border text-[13px] text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Example with current settings:</strong></p>
            <p>• ₹500 order → earns <strong className="text-foreground">{Math.round(500 * (form.loyalty_earn_pct / 100))} pts</strong></p>
            <p>• Minimum {form.loyalty_min_redeem_pts} pts → worth <strong className="text-foreground">₹{(form.loyalty_min_redeem_pts * form.loyalty_point_value).toFixed(2)}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground text-[14px] focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground';

function Field({ label, hint, required, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
