import { getAllAccounts, updateAccount, getStats } from '../data/accounts.js';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

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
          const isGoogleToken = acc.credential.startsWith('ya29.');
          let data = null;

          if (!isGoogleToken) {
            const apiRes = await fetch('https://api2.cursor.sh/exa.language_server_pb.LanguageServerService/GetUserStatus', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/connect+json',
                'Authorization': `Bearer ${acc.credential}`,
                'User-Agent': 'Cursor/0.45.0'
              },
              body: JSON.stringify({})
            });
            if (apiRes.ok) data = await apiRes.json();
          } else {
             // Mock Google Cloud Code (Antigravity) Limits since it does not use a strict numerical quota backend
             // Try to read real quota from local Antigravity state.vscdb if running locally!
             try {
                const pyScript = `
import sqlite3, json, sys, os
try:
  db_path = r'C:\\Users\\Gman\\AppData\\Roaming\\Antigravity\\User\\globalStorage\\state.vscdb'
  conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=5)
  cursor = conn.cursor()
  cursor.execute("SELECT value FROM ItemTable WHERE key='n2ns.antigravity-panel'")
  row = cursor.fetchone()
  if row:
      data = json.loads(row[0])
      print(json.dumps(data.get('tfa.lastSnapshot', {})))
except Exception as e:
  sys.exit(1)
`;
                const { stdout } = await execPromise(`python -c "${pyScript.replace(/\n/g, ' ')}"`);
                const snapshot = JSON.parse(stdout.trim());
                if (snapshot && snapshot.data) {
                   const sData = snapshot.data;
                   
                   // Find exact models from the snapshot
                   const findModel = (name) => sData.models?.find(m => m.label && m.label.includes(name));
                   const geminiProModel = findModel('Gemini 3.1 Pro');
                   const claudeModel = findModel('Claude');
                   
                   const promptCurrent = sData.promptCredits?.available ?? 500;
                   const promptMax = sData.promptCredits?.monthly ?? 50000;
                   const flowCurrent = sData.flowCredits?.available ?? 100;
                   const flowMax = sData.flowCredits?.monthly ?? 150000;

                   await updateAccount(acc.id, {
                      status: 'active',
                      models: {
                        ...acc.models,
                        geminiPro: { 
                          percent: geminiProModel ? geminiProModel.remainingPercentage : 'N/A', 
                          time: geminiProModel ? geminiProModel.timeUntilReset : 'N/A', 
                          color: 'text-emerald-400' 
                        },
                        claude: { 
                          percent: claudeModel ? claudeModel.remainingPercentage : 'N/A', 
                          time: claudeModel ? claudeModel.timeUntilReset : 'N/A', 
                          color: 'text-amber-500' 
                        }
                      },
                      credits: {
                        prompt: { current: promptCurrent, max: promptMax },
                        flow: { current: flowCurrent, max: flowMax }
                      }
                   });
                   continue; // Skip the default block
                }
             } catch(pythonErr) {
                console.log('Local DB sync failed, falling back to proxy tracking mock:', pythonErr?.message);
             }
             const currentPromptMax = acc.credits?.prompt?.max ?? 1500;
             const currentPromptUsage = acc.credits?.prompt?.current !== undefined ? (currentPromptMax - acc.credits.prompt.current) : 0;
             const currentFlowMax = acc.credits?.flow?.max ?? 500;
             const currentFlowUsage = acc.credits?.flow?.current !== undefined ? (currentFlowMax - acc.credits.flow.current) : 0;
             
             data = { stripe: { usage: { fastRequestsLimit: currentPromptMax, fastRequestsUsage: currentPromptUsage, claudeOpusLimit: currentFlowMax, claudeOpusUsage: currentFlowUsage } } };
          }

          if (data) {
            // Extract Quotas
            const stripeInfo = data.stripe || {};
            const usage = stripeInfo.usage || {};
            
            const fastLimit = usage.fastRequestsLimit ?? 1500;
            const fastUsage = usage.fastRequestsUsage ?? 0;
            const claudeLimit = usage.claudeOpusLimit ?? 500;
            const claudeUsage = usage.claudeOpusUsage ?? 0;
            
            const fastPercentCalc = fastLimit > 0 ? ((fastUsage / fastLimit) * 100).toFixed(1) : 'N/A';
            const claudePercentCalc = claudeLimit > 0 ? ((claudeUsage / claudeLimit) * 100).toFixed(1) : 'N/A';
            
            const prevGeminiTime = acc.models?.geminiPro?.time;
            const prevClaudeTime = acc.models?.claude?.time;

            const isRealGeminiData = prevGeminiTime && !prevGeminiTime.includes('Used');
            const isRealClaudeData = prevClaudeTime && !prevClaudeTime.includes('Used');
            
            await updateAccount(acc.id, {
              status: fastUsage >= fastLimit ? 'warning' : 'active',
              models: {
                ...acc.models,
                geminiPro: { 
                  percent: acc.models?.geminiPro?.percent !== 'N/A' && isRealGeminiData ? acc.models.geminiPro.percent : (isNaN(fastPercentCalc) ? 'N/A' : (100 - parseFloat(fastPercentCalc)).toFixed(1)), 
                  time: isRealGeminiData ? prevGeminiTime : `Used ${Math.min(fastUsage, fastLimit)}/${fastLimit}`, 
                  color: 'text-emerald-400' 
                },
                claude: { 
                  percent: acc.models?.claude?.percent !== 'N/A' && isRealClaudeData ? acc.models.claude.percent : (isNaN(claudePercentCalc) ? 'N/A' : (100 - parseFloat(claudePercentCalc)).toFixed(1)), 
                  time: isRealClaudeData ? prevClaudeTime : `Used ${Math.min(claudeUsage, claudeLimit)}/${claudeLimit}`, 
                  color: 'text-amber-500' 
                }
              },
              credits: {
                prompt: { current: Math.max(0, fastLimit - fastUsage), max: fastLimit },
                flow: { current: Math.max(0, claudeLimit - claudeUsage), max: claudeLimit }
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
