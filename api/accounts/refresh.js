import { getAllAccounts, updateAccount, getStats } from '../data/accounts.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accounts = await getAllAccounts();
    
    // Process Antigravity/Cursor Accounts
    for (const acc of accounts) {
      if (acc.provider === 'antigravity' && acc.credential) {
        try {
          const apiRes = await fetch('https://api2.cursor.sh/exa.language_server_pb.LanguageServerService/GetUserStatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/connect+json',
              'Authorization': `Bearer ${acc.credential}`
            },
            body: JSON.stringify({})
          });

          if (apiRes.ok) {
            const data = await apiRes.json();
            
            // Extract Quotas
            const stripeInfo = data.stripe || {};
            const usage = stripeInfo.usage || {};
            
            // Default mapping, Antigravity might inject usage differently.
            // Using typical Cursor Usage fields:
            const fastLimit = usage.fastRequestsLimit ?? 500;
            const fastUsage = usage.fastRequestsUsage ?? 0;
            const claudeLimit = usage.claudeOpusLimit ?? 10;
            const claudeUsage = usage.claudeOpusUsage ?? 0;
            const gpt4Usage = usage.gpt4Usage ?? 0;
            
            const fastPercent = fastLimit > 0 ? ((fastUsage / fastLimit) * 100).toFixed(1) : 'N/A';
            const claudePercent = claudeLimit > 0 ? ((claudeUsage / claudeLimit) * 100).toFixed(1) : 'N/A';
            // Mapping fast requests to Gemini Pro, Claude Opus to Claude
            
            await updateAccount(acc.id, {
              status: fastUsage >= fastLimit ? 'warning' : 'active',
              models: {
                ...acc.models,
                geminiPro: { 
                  percent: isNaN(fastPercent) ? 'N/A' : (100 - parseFloat(fastPercent)), 
                  time: `Used ${fastUsage}/${fastLimit}`, 
                  color: 'text-emerald-400' 
                },
                claude: { 
                  percent: isNaN(claudePercent) ? 'N/A' : (100 - parseFloat(claudePercent)), 
                  time: `Used ${claudeUsage}/${claudeLimit}`, 
                  color: 'text-amber-500' 
                }
              },
              credits: {
                prompt: { current: Math.max(0, fastLimit - fastUsage), max: fastLimit },
                flow: { current: acc.credits.flow.current, max: acc.credits.flow.max }
              }
            });
          } else {
             await updateAccount(acc.id, { status: 'error' });
          }
        } catch (e) {
          console.error(`Error fetching quota for ${acc.id}:`, e);
          await updateAccount(acc.id, { status: 'error' });
        }
      }
    }

    const updatedStats = await getStats();
    const updatedAccounts = await getAllAccounts();

    return res.status(200).json({
      accounts: updatedAccounts,
      stats: updatedStats,
      refreshedAt: new Date().toISOString(),
      message: 'Quotas refreshed successfully',
    });
  } catch (err) {
    console.error('Refresh Error:', err);
    return res.status(500).json({ error: 'Failed to refresh quotas' });
  }
}
