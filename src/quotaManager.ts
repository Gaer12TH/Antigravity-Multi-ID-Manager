import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as http from 'http';
import * as https from 'https';

export interface NativeModelQuota {
    name: string;
    percentage: number;
    resetIn: string;
}

export interface CreditInfo {
    promptUsed: number;
    promptTotal: number;
    promptPercent: number;
    flowUsed: number;
    flowTotal: number;
    flowPercent: number;
}

export interface AccountQuota {
    email: string;
    tier: string;
    lastUpdated: number;
    models: NativeModelQuota[];
    credits: CreditInfo | null;
}

export interface QuotaData {
    accounts: Record<string, AccountQuota>;
    activeEmail: string | null;
}

export class QuotaManager {
    private data: QuotaData = { accounts: {}, activeEmail: null };
    private pollingInterval: NodeJS.Timeout | null = null;
    public onChange: vscode.EventEmitter<QuotaData> = new vscode.EventEmitter<QuotaData>();

    constructor(private context: vscode.ExtensionContext) {
        this.loadData();
    }

    public async startTracking() {
        await this.fetchLocalApis();
        this.pollingInterval = setInterval(() => this.fetchLocalApis(), 15000);
    }

    public stopTracking() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    public getData(): QuotaData {
        return this.data;
    }

    public forceScan() {
        this.fetchLocalApis();
    }

    private loadData() {
        const stored = this.context.globalState.get<QuotaData>('agq.nativeDataV3');
        if (stored) {
            this.data = stored;
            if (!this.data.accounts) this.data.accounts = {};
        }
    }

    private async saveData() {
        await this.context.globalState.update('agq.nativeDataV3', this.data);
        this.onChange.fire(this.data);
    }

    private formatResetTime(resetTimeStr: string): string {
        const resetDate = new Date(resetTimeStr);
        if (Number.isNaN(resetDate.getTime())) return 'unknown';
        const ms = resetDate.getTime() - Date.now();
        if (ms <= 0) return 'Available';
        const minutes = Math.floor(ms / 60000);
        if (minutes < 60) return `${minutes} min`;
        
        const d = Math.floor(minutes / 1440);
        const h = Math.floor((minutes % 1440) / 60);
        const m = minutes % 60;
        
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        
        return parts.join(' ');
    }

    private parseStatusResponse(json: any): AccountQuota | null {
        const userStatus = json?.userStatus;
        if (!userStatus) return null;

        const email = userStatus.email;
        if (!email) return null;

        const planStatus = userStatus.planStatus || {};
        const planInfo = planStatus.planInfo || {};
        const tier = userStatus.userTier?.name || planInfo.teamsTier || 'Unknown';

        let credits: CreditInfo | null = null;
        if (planStatus.monthlyPromptCredits !== undefined && planStatus.availablePromptCredits !== undefined) {
            const pTot = Number(planStatus.monthlyPromptCredits);
            const pAvail = Number(planStatus.availablePromptCredits);
            const pUsed = Math.max(0, pTot - pAvail);
            const pPct = pTot > 0 ? Math.round((pUsed / pTot) * 100) : 0;

            let fTot = 0, fAvail = 0, fUsed = 0, fPct = 0;
            if (planStatus.monthlyFlowCredits !== undefined && planStatus.availableFlowCredits !== undefined) {
                fTot = Number(planStatus.monthlyFlowCredits);
                fAvail = Number(planStatus.availableFlowCredits);
                fUsed = Math.max(0, fTot - fAvail);
                fPct = fTot > 0 ? Math.round((fUsed / fTot) * 100) : 0;
            }

            credits = {
                promptUsed: pUsed,
                promptTotal: pTot,
                promptPercent: pPct,
                flowUsed: fUsed,
                flowTotal: fTot,
                flowPercent: fPct
            };
        }

        const models: NativeModelQuota[] = [];
        const clientConfigs = userStatus.cascadeModelConfigData?.clientModelConfigs || [];
        for (const config of clientConfigs) {
            if (config.quotaInfo) {
                models.push({
                    name: config.label || config.modelOrAlias?.model || 'Unknown Model',
                    percentage: Math.round((config.quotaInfo.remainingFraction ?? 0) * 100),
                    resetIn: this.formatResetTime(config.quotaInfo.resetTime)
                });
            }
        }

        return {
            email,
            tier,
            lastUpdated: Date.now(),
            models,
            credits
        };
    }

    private fetchStatus(port: number, csrfToken: string, protocol: 'https' | 'http'): Promise<any> {
        return new Promise((resolve) => {
            const payload = JSON.stringify({ metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' } });
            const client = protocol === 'https' ? https : http;
            const options = {
                hostname: '127.0.0.1',
                port,
                path: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
                method: 'POST',
                headers: {
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': csrfToken,
                    'Content-Type': 'application/json'
                },
                timeout: 5000,
                rejectUnauthorized: false // Local self-signed certificates
            };
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.write(payload);
            req.end();
        });
    }

    private async findAndFetch() {
        return new Promise<void>((resolve) => {
            // Find listening ports mapped to PIDs
            cp.exec('netstat -ano | findstr LISTEN', async (err, netstatOut) => {
                const pidPortsMap: Record<number, number[]> = {};
                if (!err && netstatOut) {
                    const lines = netstatOut.split('\n');
                    for (const l of lines) {
                        const parts = l.trim().split(/\s+/);
                        if (parts.length >= 5) {
                            const portMatch = parts[1].match(/:(\d+)$/);
                            const pid = parseInt(parts[parts.length - 1], 10);
                            if (portMatch) {
                                if (!pidPortsMap[pid]) pidPortsMap[pid] = [];
                                pidPortsMap[pid].push(parseInt(portMatch[1], 10));
                            }
                        }
                    }
                }

                // Find language server processes mapping CSRF
                cp.exec('wmic process get processid,commandline /format:csv', { maxBuffer: 1024 * 1024 * 10 }, async (err, wmicOut) => {
                    if (err || !wmicOut) return resolve();

                    const lines = wmicOut.split('\n').filter(l => l.includes('language_server') && l.includes('--csrf_token'));
                    let anyUpdates = false;

                    for (const l of lines) {
                        const match = l.match(/,([^,]+),(\d+)\s*$/);
                        if (!match) continue;
                        const pid = parseInt(match[2], 10);
                        const csrfMatch = l.match(/--csrf_token[=\s]+([a-zA-Z0-9\-_.]+)/);
                        if (!csrfMatch) continue;
                        const csrfToken = csrfMatch[1];
                        
                        const ports = pidPortsMap[pid] || [];
                        for (const port of ports) {
                            // Try HTTPS first
                            let resp = await this.fetchStatus(port, csrfToken, 'https');
                            // Fallback to HTTP
                            if (!resp) {
                                resp = await this.fetchStatus(port, csrfToken, 'http');
                            }
                            
                            if (resp) {
                                const accountData = this.parseStatusResponse(resp);
                                if (accountData) {
                                    this.data.accounts[accountData.email] = accountData;
                                    this.data.activeEmail = accountData.email;
                                    anyUpdates = true;
                                    // Found a valid port for this PID, break to next process
                                    break;
                                }
                            }
                        }
                    }

                    if (anyUpdates) {
                        this.saveData();
                    }
                    resolve();
                });
            });
        });
    }

    private async fetchLocalApis() {
        try {
            await this.findAndFetch();
        } catch (e) {
            console.error('Error fetching local API:', e);
        }
    }
}
