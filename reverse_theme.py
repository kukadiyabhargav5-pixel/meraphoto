import os

def reverse_layout():
    layout_path = 'src/app/dashboard/layout.tsx'
    if os.path.exists(layout_path):
        with open(layout_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace('bg-white text-black', 'bg-[#09090b] text-[#faf9f6]')
        content = content.replace('border-slate-200', 'border-white/5')
        
        with open(layout_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Reversed layout.tsx")

def reverse_pages():
    base_dir = 'src/app/dashboard'
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file == 'page.tsx' and root != base_dir:
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                content = content.replace('bg-white text-black', 'bg-[#09090b] text-white')
                content = content.replace('text-slate-700', 'text-slate-300')
                content = content.replace('text-slate-600', 'text-slate-400')
                content = content.replace('bg-slate-50', 'bg-white/[0.02]')
                content = content.replace('border-slate-200', 'border-white/10')
                content = content.replace('text-slate-900', 'text-white')
                content = content.replace('bg-white', 'bg-[#0c0c0e]')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Reversed {filepath}")

if __name__ == '__main__':
    reverse_layout()
    reverse_pages()
