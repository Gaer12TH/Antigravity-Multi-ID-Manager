import { getAccountById, updateAccount, deleteAccount, getStats } from '../data/accounts.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // GET /api/accounts/:id — ดึงข้อมูล account เดียว
      const account = await getAccountById(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.status(200).json({ account });
    }

    if (req.method === 'PUT') {
      // PUT /api/accounts/:id — อัพเดท account
      const updated = await updateAccount(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Account not found' });
      }
      const stats = await getStats();
      return res.status(200).json({ account: updated, stats });
    }

    if (req.method === 'DELETE') {
      // DELETE /api/accounts/:id — ลบ account
      const deleted = await deleteAccount(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Account not found' });
      }
      const stats = await getStats();
      return res.status(200).json({ success: true, stats });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
