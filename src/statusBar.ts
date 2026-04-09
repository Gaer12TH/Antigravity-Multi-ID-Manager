import * as vscode from 'vscode';
import { QuotaManager, QuotaData } from './quotaManager';

export class StatusBarController {
    private statusBarItem: vscode.StatusBarItem;
    private pinnedKeys: string[] = [];

    constructor(private context: vscode.ExtensionContext, private quotaManager: QuotaManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'agq.openDashboard';
        this.context.subscriptions.push(this.statusBarItem);

        // Load persisted pins
        this.pinnedKeys = this.context.globalState.get<string[]>('agq.pinnedModels') || [];

        this.quotaManager.onChange.event((data) => this.update(data));
        this.update(this.quotaManager.getData());
    }

    public updatePins(pins: string[]) {
        this.pinnedKeys = pins;
        this.update(this.quotaManager.getData());
    }

    public update(data: QuotaData) {
        if (!data.activeEmail || !data.accounts[data.activeEmail]) {
            this.statusBarItem.text = '$(sync~spin) AGQ: Syncing...';
            this.statusBarItem.tooltip = 'Scanning for native IDE quotas...';
            this.statusBarItem.show();
            return;
        }

        const activeAccount = data.accounts[data.activeEmail];
        const emailId = data.activeEmail.replace(/[@.]/g, '_');

        // Build tooltip markdown
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportThemeIcons = true;
        md.appendMarkdown(`### $(dashboard) Native Quota Monitor\n\n`);
        md.appendMarkdown(`$(account) &nbsp;**${data.activeEmail}**&nbsp;&nbsp;|&nbsp;&nbsp;$(verified-filled) *${activeAccount.tier || 'Unknown'}*\n\n---\n\n`);

        let statusText = '';
        let lowestPercent = 100;

        if (this.pinnedKeys.length > 0) {
            // Show pinned models in status bar text
            const pinnedModels = activeAccount.models.filter(m => {
                const key = `${emailId}__${m.name.replace(/\s+/g, '_')}`;
                return this.pinnedKeys.includes(key);
            });

            if (pinnedModels.length > 0) {
                const parts = pinnedModels.map(m => {
                    if (m.percentage < lowestPercent) lowestPercent = m.percentage;
                    
                    let shortName = m.name;
                    if (m.name.includes('Pro (High)')) shortName = 'Pro (High)';
                    else if (m.name.includes('Pro (Low)')) shortName = 'Pro (Low)';
                    else if (m.name.includes('Flash')) shortName = 'Flash';
                    else if (m.name.includes('Sonnet')) shortName = 'Sonnet';
                    else if (m.name.includes('Opus')) shortName = 'Opus';
                    else if (m.name.includes('GPT-OSS')) shortName = 'GPT';
                    else {
                        // Fallback: take first word and anything in parentheses
                        const match = m.name.match(/\(([^)]+)\)/);
                        shortName = m.name.split(' ')[0] + (match ? ` (${match[1]})` : '');
                    }
                    
                    return `${shortName}: ${m.percentage}%`;
                });
                
                const alertIcon = lowestPercent < 20 ? '$(error)' : lowestPercent < 50 ? '$(warning)' : '$(check)';
                statusText = `${alertIcon} ${parts.join(' | ')}`;
            } else {
                // Pinned keys set but none belong to active account — fallback to lowest
                activeAccount.models.forEach(m => { if (m.percentage < lowestPercent) lowestPercent = m.percentage; });
                const alertIcon = lowestPercent < 20 ? '$(error)' : lowestPercent < 50 ? '$(warning)' : '$(check)';
                statusText = `${alertIcon} AGQ: ${lowestPercent}%`;
            }
        } else {
            // No pins — show lowest % as before
            activeAccount.models.forEach(m => { if (m.percentage < lowestPercent) lowestPercent = m.percentage; });
            const alertIcon = lowestPercent < 20 ? '$(error)' : lowestPercent < 50 ? '$(warning)' : '$(check)';
            statusText = `${alertIcon} AGQ: ${lowestPercent}%`;
        }

        // Build full tooltip with all models
        activeAccount.models.forEach(m => {
            const key = `${emailId}__${m.name.replace(/\s+/g, '_')}`;
            const isPinned = this.pinnedKeys.includes(key);
            const icon = m.percentage < 20 ? '$(error)' : m.percentage < 50 ? '$(warning)' : '$(pass)';
            const pinMark = isPinned ? ' 📌' : '';
            md.appendMarkdown(`${icon} **${m.name}**${pinMark}\n\n`);
            md.appendMarkdown(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$(pie-chart) **${m.percentage}%** remaining &nbsp;•&nbsp; $(clock) *Resets in ${m.resetIn}*\n\n`);
        });

        const otherEmails = Object.keys(data.accounts).filter(e => e !== data.activeEmail);
        if (otherEmails.length > 0) {
            md.appendMarkdown('---\n\n#### $(organization) Offline Accounts\n\n');
            otherEmails.forEach(e => { md.appendMarkdown(`$(circle-outline) ${e}\n\n`); });
        }

        md.appendMarkdown('---\n\n[$(link-external) Open Full Dashboard](command:agq.openDashboard "Launch the interactive dashboard panel")');

        this.statusBarItem.text = statusText;
        // Don't set the entire status bar text color because we use emojis per item now.
        this.statusBarItem.color = undefined;

        this.statusBarItem.tooltip = md;
        this.statusBarItem.show();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}
