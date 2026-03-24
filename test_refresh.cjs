const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function test() {
  const pyScript = `import sqlite3, json, sys; db_path = 'C:/Users/Gman/AppData/Roaming/Antigravity/User/globalStorage/state.vscdb'; conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True, timeout=5); cursor = conn.cursor(); cursor.execute("SELECT value FROM ItemTable WHERE key='n2ns.antigravity-panel'"); row = cursor.fetchone(); print(json.dumps(json.loads(row[0]).get('tfa.lastSnapshot', {}))) if row else sys.exit(1)`;
  try {
    const { stdout } = await execPromise(`python -c "${pyScript}"`);
    console.log("SUCCESS! OUTPUT IS:", stdout.trim().substring(0, 100));
  } catch (err) {
    console.error("FAILED!", err);
  }
}
test();
