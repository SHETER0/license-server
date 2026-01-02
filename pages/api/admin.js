import dbConnect from '../../lib/dbConnect';
import License from '../../models/License';

export default async function handler(req, res) {
  const { method } = req;
  const adminPassword = req.headers['x-admin-password'];

  // 1. Security Check
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Wrong Password' });
  }

  await dbConnect();

  try {
    // GET: List all licenses (newest first)
    if (method === 'GET') {
      const licenses = await License.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, licenses });
    }

    // POST: Generate a new License
    if (method === 'POST') {
     const { type, days, email } = req.body; //
      // Calculate Expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(days));

      // Generate Random Key (XXXX-XXXX-XXXX-XXXX)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let key = (type === 'trial' ? 'TRIAL-' : 'PRO-');
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) key += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i < 3) key += '-';
      }

      const newLicense = await License.create({
        key,
        licenseType: type,
        expiryDate,
        email: email || null,
        status: 'active'
      });

      return res.status(201).json({ success: true, license: newLicense });
    }

    // DELETE: Remove a license
    if (method === 'DELETE') {
      const { id } = req.query;
      await License.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}