import re

content = open(r'C:\Users\Gman\.antigravity\extensions\n2ns.antigravity-panel-2.5.13-universal\dist\extension.js', 'r', encoding='utf-8').read()

# Specifically find the request method in the class where doFetchQuota is located.
# The class ends with some unique methods. Let's just find "async request("
idx = content.find('async request(')
if idx > 0:
    print(content[idx-100:idx+2000])

