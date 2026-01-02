// pages/api/validate.js
import dbConnect from '../../lib/dbConnect';
import License from '../../models/License';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  const { key, hardwareId } = req.body;

  if (!key || !hardwareId) {
    return res.status(400).json({ valid: false, error: 'Missing key or machine ID' });
  }

  try {
    await dbConnect();

    // 1. Find the license
    const license = await License.findOne({ key: key });

    if (!license) {
      return res.status(404).json({ valid: false, error: 'License key not found' });
    }

    // 2. Check Status
    if (license.status !== 'active') {
      return res.status(403).json({ valid: false, error: 'License is ' + license.status });
    }

    // 3. Check Expiry (Server Time vs Expiry Date)
    const now = new Date();
    if (now > license.expiryDate) {
      return res.status(403).json({ valid: false, error: 'License expired' });
    }

    // 4. Hardware Lock Logic
    // If hardwareId is null (never used), lock it to this machine
    if (!license.hardwareId) {
      license.hardwareId = hardwareId;
      await license.save();
    } 
    // If it has a hardwareId, make sure it matches the sender
    else if (license.hardwareId !== hardwareId) {
      return res.status(401).json({ 
        valid: false, 
        error: 'License is locked to a different machine. Contact support to reset.' 
      });
    }

    // 5. Update last check-in time (Success)
    license.lastCheckIn = now;
    await license.save();

    // 6. Return Success
    return res.status(200).json({
      valid: true,
      expiry: license.expiryDate,
      daysRemaining: Math.ceil((license.expiryDate - now) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ valid: false, error: 'Internal Server Error' });
  }
}