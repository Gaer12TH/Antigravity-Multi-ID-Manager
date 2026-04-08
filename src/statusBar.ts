import * as vscode from 'vscode';
import { QuotaManager, QuotaData } from './quotaManager';

export class StatusBarController {
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext, private quotaManager: QuotaManager) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'agq.openDashboard';
        this.context.subscriptions.push(this.statusBarItem);
        
        this.quotaManager.onChange.event((data) => this.update(data));
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
        let lowestPercent = 100;

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`## Native Quota\n\n**${data.activeEmail}** (${activeAccount.tier})\n\n`);

        activeAccount.models.forEach(m => {
            if (m.percentage < lowestPercent) lowestPercent = m.percentage;
            md.appendMarkdown(`**${m.name}**: ${m.percentage}% (Resets in ${m.resetIn})\n\n`);
        });

        const otherEmails = Object.keys(data.accounts).filter(e => e !== data.activeEmail);
        if (otherEmails.length > 0) {
            md.appendMarkdown('---\n\n### Offline Accounts\n\n');
            otherEmails.forEach(e => {
                md.appendMarkdown(`- ${e}\n`);
            });
        }

        md.appendMarkdown('---\n\n*[Open Dashboard](command:agq.openDashboard)* for details.');

        const alertIcon = lowestPercent < 20 ? '$(error)' : lowestPercent < 50 ? '$(warning)' : '$(check)';
        this.statusBarItem.text = `${alertIcon} AGQ: ${lowestPercent}%`;
        
        if (lowestPercent < 20) {
            this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        } else if (lowestPercent < 50) {
            this.statusBarItem.color = new vscode.ThemeColor('charts.yellow');
        } else {
            this.statusBarItem.color = new vscode.ThemeColor('testing.iconPassed');
        }

        this.statusBarItem.tooltip = md;
        this.statusBarItem.show();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}
