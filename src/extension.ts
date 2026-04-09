import * as vscode from 'vscode';
import { QuotaManager } from './quotaManager';
import { StatusBarController } from './statusBar';
import { DashboardPanel } from './dashboard';
import { SidebarProvider } from './sidebar';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Antigravity Native Quota is now active!');

    // Initialize quota manager
    const quotaManager = new QuotaManager(context);
    quotaManager.startTracking();

    // Initialize status bar
    const statusBarController = new StatusBarController(context, quotaManager);

    // Initialize sidebar
    const sidebarProvider = new SidebarProvider(context.extensionUri, quotaManager, context);
    sidebarProvider.onPinsChanged = (pins) => {
        statusBarController.updatePins(pins);
    };
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agq.showDashboard', () => {
            DashboardPanel.createOrShow(context.extensionUri, quotaManager);
        }),
        vscode.commands.registerCommand('agq.openDashboard', () => {
            DashboardPanel.createOrShow(context.extensionUri, quotaManager);
        }),
        vscode.commands.registerCommand('agq.refresh', () => {
            quotaManager.forceScan();
            vscode.window.showInformationMessage('Refreshing Native Quotas from IDE logs...');
        })
    );

    context.subscriptions.push({ dispose: () => quotaManager.stopTracking() });
}

export function deactivate() {}
