import { useState, useEffect } from 'react';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null); // ID of copied key
  
  // Form State
  const [type, setType] = useState('premium');
  const [days, setDays] = useState(365);

  // Fetch licenses
  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      
      if (data.success) {
        setLicenses(data.licenses);
        setIsLoggedIn(true);
      } else {
        alert("Incorrect Password");
      }
    } catch (e) {
      alert("Connection Error");
    }
    setLoading(false);
  };

  // Create license
  const createLicense = async (e) => {
    e.preventDefault();
    if (!confirm(`Generate 1 ${type.toUpperCase()} key?`)) return;

    setLoading(true);
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ type, days })
    });
    await fetchLicenses();
  };

  // Delete license
  const deleteLicense = async (id) => {
    if (!confirm("Permanently delete this key? Users will lose access immediately.")) return;
    setLoading(true);
    await fetch('/api/admin?id=' + id, {
      method: 'DELETE',
      headers: { 'x-admin-password': password }
    });
    await fetchLicenses();
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // --- 1. LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>Admin Access</h2>
          <p style={styles.loginSubtitle}>Enter your master password to manage licenses.</p>
          <form onSubmit={(e) => { e.preventDefault(); fetchLicenses(); }} style={styles.loginForm}>
            <input 
              type="password" 
              placeholder="Master Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? 'Verifying...' : 'Login Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. MAIN DASHBOARD ---
  return (
    <div style={styles.dashboard}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>🛡️ License Manager</div>
        <button onClick={() => setIsLoggedIn(false)} style={styles.secondaryBtn}>Sign Out</button>
      </nav>

      <main style={styles.main}>
        {/* Generator Section */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h3>Generate License</h3>
            <span style={styles.badge}>New Sale</span>
          </div>
          <form onSubmit={createLicense} style={styles.generatorForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>License Tier</label>
              <select value={type} onChange={e => setType(e.target.value)} style={styles.select}>
                <option value="premium">Premium (All Features)</option>
                <option value="standard">Standard (Basic)</option>
                <option value="trial">Trial (Limited)</option>
              </select>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Duration</label>
              <select value={days} onChange={e => setDays(e.target.value)} style={styles.select}>
                <option value="365">1 Year (365 Days)</option>
                <option value="30">1 Month (30 Days)</option>
                <option value="36500">Lifetime (Unlimited)</option>
              </select>
            </div>

            <div style={styles.actionGroup}>
              <label style={styles.label}>Action</label>
              <button type="submit" style={styles.createBtn} disabled={loading}>
                {loading ? 'Generating...' : '✨ Generate Key'}
              </button>
            </div>
          </form>
        </section>

        {/* List Section */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h3>Active Keys ({licenses.length})</h3>
            <button onClick={fetchLicenses} style={styles.iconBtn}>🔄 Refresh</button>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>License Key</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Expiry</th>
                  <th style={styles.th}>Hardware Lock</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(lic => (
                  <tr key={lic._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div 
                        style={styles.keyContainer} 
                        onClick={() => copyToClipboard(lic.key, lic._id)}
                        title="Click to Copy"
                      >
                        <span style={styles.keyText}>{lic.key}</span>
                        {copyFeedback === lic._id && <span style={styles.copiedBadge}>Copied!</span>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getBadgeStyle(lic.licenseType)}>{lic.licenseType.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                       <span style={lic.status === 'active' ? styles.statusActive : styles.statusBanned}>
                         ● {lic.status}
                       </span>
                    </td>
                    <td style={styles.td}>{new Date(lic.expiryDate).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      {lic.hardwareId ? 
                        <span style={styles.hwLocked} title={lic.hardwareId}>🔒 Locked</span> : 
                        <span style={styles.hwOpen}>🔓 Open</span>
                      }
                    </td>
                    <td style={styles.tdRight}>
                      <button 
                        onClick={() => deleteLicense(lic._id)}
                        style={styles.deleteBtn}
                        title="Revoke License"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan="6" style={styles.emptyState}>No licenses found. Generate one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// --- STYLES ---
const getBadgeStyle = (type) => {
    switch(type) {
        case 'premium': return styles.badgeGold;
        case 'trial': return styles.badgeBlue;
        default: return styles.badgeGray;
    }
};

const styles = {
  // Global Layout
  dashboard: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#111827' },
  nav: { backgroundColor: '#ffffff', padding: '15px 40px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  logo: { fontWeight: '700', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' },
  main: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' },

  // Login Screen
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' },
  loginCard: { width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
  loginTitle: { margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' },
  loginSubtitle: { margin: '0 0 30px 0', color: '#6b7280', fontSize: '14px' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '15px' },

  // Components
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  
  // Generator Form
  generatorForm: { padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end', backgroundColor: '#fafafa' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actionGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { padding: '10px 12px', borderRadius: '6px', color: "#000", border: '1px solid #d1d5db', backgroundColor: '#ffffff', fontSize: '14px', height: '42px' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none' },

  // Buttons
  primaryBtn: { padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
  secondaryBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  createBtn: { padding: '0 24px', height: '42px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  iconBtn: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' },

  // Table
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },
  thRight: { padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '16px 24px', color: '#111827' },
  tdRight: { padding: '16px 24px', textAlign: 'right' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#6b7280' },

  // Badges & Status
  keyContainer: { fontFamily: 'Monaco, Consolas, monospace', background: '#f3f4f6', padding: '6px 10px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' },
  keyText: { fontWeight: '600', color: '#374151' },
  copiedBadge: { position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', pointerEvents: 'none' },
  
  badgeGold: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  badgeBlue: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  badgeGray: { backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  badge: { backgroundColor: '#d1fae5', color: '#065f46', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' },

  statusActive: { color: '#059669', fontWeight: '500', fontSize: '13px' },
  statusBanned: { color: '#dc2626', fontWeight: '500', fontSize: '13px' },
  
  hwLocked: { color: '#d97706', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
  hwOpen: { color: '#059669', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
};