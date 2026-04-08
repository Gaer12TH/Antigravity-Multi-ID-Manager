const cp = require('child_process');
const http = require('http');
const https = require('https');

function fetchStatus(port, csrfToken, protocol) {
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
            rejectUnauthorized: false
        };
        const req = client.request(options, (res) => {
            let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', (e) => resolve({ status: 0, error: e.message })); req.write(payload); req.end();
    });
}

cp.exec('netstat -ano | findstr LISTEN', (err, stdout) => {
    const netstatLines = stdout.split('\n');
    let pidPortsMap = {};
    for (const l of netstatLines) {
        // TCP    0.0.0.0:8045           0.0.0.0:0              LISTENING       1234
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

    cp.exec('wmic process get processid,commandline /format:csv', { maxBuffer: 1024 * 1024 * 10 }, async (err, stdout) => {
        let lines = stdout.split('\n').filter(l => l.includes('language_server_windows_x64.exe') && l.includes('--csrf_token'));
        for (const l of lines) {
            const match = l.match(/,([^,]+),(\d+)\s*$/);
            if (!match) continue;
            const pid = parseInt(match[2], 10);
            const csrfToken = l.match(/--csrf_token[=\s]+([a-zA-Z0-9\-_.]+)/)[1];
            
            console.log(`\nPID ${pid} with CSRF ${csrfToken}`);
            const ports = pidPortsMap[pid] || [];
            console.log('Listening on Ports:', ports);
            
            for(const p of ports) {
                console.log(`Port ${p}: Trying https with ${csrfToken}`);
                const res1 = await fetchStatus(p, csrfToken, 'https');
                console.log(`status: ${res1.status}`);
                if(res1.status === 200) console.log('DATA:', res1.data.substring(0,200));

                console.log(`Port ${p}: Trying http with ${csrfToken}`);
                const res2 = await fetchStatus(p, csrfToken, 'http');
                console.log(`status: ${res2.status}`);
                if(res2.status === 200) console.log('DATA:', res2.data.substring(0,200));
            }
        }
    });
});
