import re

with open('scratch/returnStatement.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the actual return statement of the component
match = re.search(r'return\s*\(\s*<div', text)
if match:
    start_idx = match.start()
    ui_code = text[start_idx:]
    with open('scratch/ui_code.txt', 'w', encoding='utf-8') as f:
        f.write(ui_code)
    print("UI Code extracted successfully.")
else:
    print("Could not find start of UI return.")
