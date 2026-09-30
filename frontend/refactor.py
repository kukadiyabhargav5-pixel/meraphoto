import os

def find_matching_brace(text, start_index):
    count = 0
    for i in range(start_index, len(text)):
        if text[i] == '{':
            count += 1
        elif text[i] == '}':
            count -= 1
            if count == 0:
                return i
    return -1

def process_file():
    with open('src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    tabs = ['customers', 'team', 'bookings', 'quotations', 'bills', 'payment-qr', 'calendar', 'profile', 'branding', 'plans-billing', 'support']
    
    # Just extracting them to see if it works
    for tab in tabs:
        search_str = f"activeTab === '{tab}'"
        idx = content.find(search_str)
        if idx != -1:
            print(f"Found {tab}")
            # Find the enclosing {}
            
process_file()
