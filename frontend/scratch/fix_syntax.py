import sys

file_path = 'd:/Mara Photo/Mara Photo/frontend/src/app/admin/contacts/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace escaped backticks with regular backticks
content = content.replace(r'\`', '`')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
