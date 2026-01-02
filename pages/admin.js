import { useState, useEffect } from 'react';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);
  
  // Form State
  const [type, setType] = useState('premium');
  const [days, setDays] = useState(365);
  const [email, setEmail] = useState('');

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
    if (!confirm(`Generate 1 ${type.toUpperCase()} key for ${email || 'Anonymous'}?`)) return;

    setLoading(true);
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ type, days, email })
    });
    setEmail(''); 
    await fetchLicenses();
  };

  // Delete license
  const deleteLicense = async (id) => {
    if (!confirm("Permanently delete this key?")) return;
    setLoading(true);
    await fetch('/api/admin?id=' + id, {
      method: 'DELETE',
      headers: { 'x-admin-password': password }
    });
    await fetchLicenses();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // --- 1. LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Admin Access</h2>
          <p>Enter your master password.</p>
          <form onSubmit={(e) => { e.preventDefault(); fetchLicenses(); }} className="login-form">
            <input 
              type="password" 
              placeholder="Master Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
        <StyleSheet />
      </div>
    );
  }

  // --- 2. MAIN DASHBOARD ---
  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="logo">🛡️ License Manager</div>
        <button onClick={() => setIsLoggedIn(false)} className="secondary-btn">Sign Out</button>
      </nav>

      <main className="main">
        {/* Generator Section */}
        <section className="card">
          <div className="card-header">
            <h3>Generate License</h3>
            <span className="badge">New Sale</span>
          </div>
          <form onSubmit={createLicense} className="generator-form">
            <div className="input-group">
              <label>Customer Email</label>
              <input 
                type="email" 
                placeholder="customer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>License Tier</label>
              <select value={type} onChange={e => setType(e.target.value)} className="select-field">
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Duration</label>
              <select value={days} onChange={e => setDays(e.target.value)} className="select-field">
                <option value="365">1 Year</option>
                <option value="30">1 Month</option>
                <option value="36500">Lifetime</option>
              </select>
            </div>

            <div className="action-group">
              <label>&nbsp;</label>
              <button type="submit" className="create-btn" disabled={loading}>
                {loading ? '...' : '✨ Generate Key'}
              </button>
            </div>
          </form>
        </section>

        {/* List Section */}
        <section className="card">
          <div className="card-header">
            <h3>Active Keys ({licenses.length})</h3>
            <button onClick={fetchLicenses} className="refresh-btn">🔄 Refresh</button>
          </div>
          
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>License Key</th>
                  <th>Customer Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Hardware</th>
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(lic => (
                  <tr key={lic._id}>
                    <td>
                      <div 
                        className="key-container" 
                        onClick={() => copyToClipboard(lic.key, lic._id)}
                      >
                        <span className="key-text">{lic.key}</span>
                        {copyFeedback === lic._id && <span className="copied-badge">Copied!</span>}
                      </div>
                    </td>
                    <td className="email-cell">{lic.email || <span style={{opacity:0.3}}>Anonymous</span>}</td>
                    <td><span className={`badge-${lic.licenseType}`}>{lic.licenseType.toUpperCase()}</span></td>
                    <td>
                       <span className={lic.status === 'active' ? 'status-active' : 'status-banned'}>
                         ● {lic.status}
                       </span>
                    </td>
                    <td>
                      {lic.hardwareId ? 
                        <span className="hw-locked" title={lic.hardwareId}>🔒 Locked</span> : 
                        <span className="hw-open">🔓 Open</span>
                      }
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <button onClick={() => deleteLicense(lic._id)} className="delete-btn">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <StyleSheet />
    </div>
  );
}

// --- DARK MODE CSS ---
const StyleSheet = () => (
  <style jsx global>{`
    /* Global Dark Theme Reset */
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      background-color: #0b1120; /* Darkest Slate */
      color: #e5e7eb; /* Light Gray Text */
    }
    
    /* Layout */
    .dashboard { min-height: 100vh; }
    .nav { 
      background: #111827; /* Dark Slate */
      padding: 15px 5%; 
      border-bottom: 1px solid #1f2937; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .logo { font-weight: 700; font-size: 1.2rem; color: #fff; }
    .main { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }

    /* Login */
    .login-container { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background-color: #0b1120; }
    .login-card { 
      width: 100%; max-width: 400px; padding: 40px; 
      background: #1f2937; /* Gray 800 */
      border-radius: 12px; 
      border: 1px solid #374151;
      text-align: center; 
    }
    .login-card h2 { color: #fff; margin-top: 0; }
    .login-card p { color: #9ca3af; }
    
    .login-form input { 
      width: 100%; padding: 12px; margin-bottom: 15px; 
      background: #111827; border: 1px solid #374151; color: white;
      border-radius: 6px; 
    }
    .login-form button { 
      width: 100%; padding: 12px; 
      background: #3b82f6; color: white; 
      border: none; border-radius: 6px; cursor: pointer; font-weight: 600; 
    }

    /* Cards */
    .card { 
      background: #1f2937; /* Gray 800 */
      border-radius: 12px; 
      border: 1px solid #374151; /* Gray 700 */
      overflow: hidden; 
    }
    .card-header { 
      padding: 20px 24px; 
      border-bottom: 1px solid #374151; 
      display: flex; justify-content: space-between; align-items: center; 
    }
    .card-header h3 { margin: 0; font-size: 1.1rem; color: #fff; }

    /* Forms */
    .generator-form { 
      padding: 24px; 
      display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 20px; align-items: end; 
      background: #111827; /* Darker inset for form */
    }
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    .input-group label { font-size: 0.75rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
    
    .input-field, .select-field { 
      padding: 10px 12px; border-radius: 6px; 
      border: 1px solid #374151; 
      background: #1f2937; 
      color: #fff;
      width: 100%; height: 42px; 
    }
    .input-field:focus, .select-field:focus { border-color: #3b82f6; outline: none; }

    /* Buttons */
    .create-btn { height: 42px; padding: 0 24px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
    .create-btn:hover { background: #059669; }
    
    .secondary-btn { padding: 8px 16px; border: 1px solid #374151; color: #d1d5db; background: transparent; border-radius: 6px; cursor: pointer; }
    .secondary-btn:hover { background: #374151; }
    
    .delete-btn { padding: 6px 12px; background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 600; }
    .delete-btn:hover { background: #991b1b; color: white; }
    
    .refresh-btn { background: none; border: none; color: #9ca3af; cursor: pointer; transition: color 0.2s; }
    .refresh-btn:hover { color: #fff; }

    /* Table */
    .table-wrapper { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; min-width: 600px; }
    .table th { 
      text-align: left; padding: 12px 24px; 
      border-bottom: 1px solid #374151; 
      color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; 
    }
    .table td { 
      padding: 16px 24px; 
      border-bottom: 1px solid #374151; 
      color: #d1d5db; 
    }
    .table tr:last-child td { border-bottom: none; }
    
    /* Elements */
    .key-container { 
      font-family: monospace; 
      background: #111827; 
      border: 1px solid #374151;
      padding: 6px 10px; border-radius: 4px; 
      display: inline-block; cursor: pointer; position: relative; 
      font-weight: 600; color: #60a5fa; 
    }
    .key-container:hover { border-color: #60a5fa; }
    
    .copied-badge { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; }
    .email-cell { color: #9ca3af; font-style: italic; }
    
    /* Badges */
    .badge-premium { background: #3b0764; color: #d8b4fe; border: 1px solid #6b21a8; padding: 2px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
    .badge-standard { background: #111827; color: #d1d5db; border: 1px solid #374151; padding: 2px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
    .badge-trial { background: #172554; color: #93c5fd; border: 1px solid #1e40af; padding: 2px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
    
    .status-active { color: #34d399; font-weight: 500; }
    .status-banned { color: #f87171; font-weight: 500; }
    .hw-locked { color: #fbbf24; font-size: 0.75rem; }
    .hw-open { color: #34d399; font-size: 0.75rem; }
    
    .badge { background: #064e3b; color: #34d399; font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; font-weight: 600; border: 1px solid #059669; }

    /* RESPONSIVE BREAKPOINTS */
    @media (max-width: 768px) {
      .generator-form { grid-template-columns: 1fr; gap: 15px; }
      .action-group label { display: none; }
      .create-btn { width: 100%; margin-top: 10px; }
      .nav { padding: 15px; }
      .main { padding: 0 10px; }
      .table th:nth-child(2), .table td:nth-child(2) { display: none; } /* Hide email on small screens */
    }
  `}</style>
);