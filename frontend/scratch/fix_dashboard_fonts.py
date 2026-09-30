import re

file_path = "src/app/dashboard/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's perform systematically structured replacements for font readability and contrast
replacements = [
    # 1. Labels font size: Increase from tiny 10px to 13px bold and slate-300 color for high contrast
    ('text-[10px] text-slate-400 font-bold uppercase', 'text-[12px] text-slate-300 font-bold uppercase tracking-wider'),
    ('text-[10px] text-slate-500 uppercase tracking-widest font-bold', 'text-[12px] text-slate-300 uppercase tracking-wider font-extrabold'),
    ('text-[10px] font-bold text-gray-405 uppercase tracking-wider', 'text-[13px] font-extrabold text-slate-200 uppercase tracking-wider'),
    
    # 2. Text input placeholder colors & styles (make them legible and not invisible)
    ('focus:bg-white', 'focus:bg-white/[0.04]'),
    ('placeholder="Sharma Wedding"', 'placeholder="Sharma Wedding" placeholderClassName="placeholder-slate-400"'),
    
    # 3. Dropdown list options styling (ensure option elements have dark backdrops explicitly so user can read select choices)
    ('<option key={t} value={t}>{t.replace(\'_\', \' \')}</option>', '<option className="bg-[#0c0c0e] text-white" key={t} value={t}>{t.replace(\'_\', \' \')}</option>'),
    ('<option value="PUBLIC">Public (Anyone with link)</option>', '<option className="bg-[#0c0c0e] text-white" value="PUBLIC">Public (Anyone with link)</option>'),
    ('<option value="PASSWORD">Password Protected</option>', '<option className="bg-[#0c0c0e] text-white" value="PASSWORD">Password Protected</option>'),
    ('<option value="LOGO">Custom Image Logo</option>', '<option className="bg-[#0c0c0e] text-white" value="LOGO">Custom Image Logo</option>'),
    ('<option value="TEXT">Text Only</option>', '<option className="bg-[#0c0c0e] text-white" value="TEXT">Text Only</option>'),
    ('<option value="TOP_LEFT">Top Left</option>', '<option className="bg-[#0c0c0e] text-white" value="TOP_LEFT">Top Left</option>'),
    ('<option value="TOP_RIGHT">Top Right</option>', '<option className="bg-[#0c0c0e] text-white" value="TOP_RIGHT">Top Right</option>'),
    ('<option value="BOTTOM_LEFT">Bottom Left</option>', '<option className="bg-[#0c0c0e] text-white" value="BOTTOM_LEFT">Bottom Left</option>'),
    ('<option value="BOTTOM_RIGHT">Bottom Right</option>', '<option className="bg-[#0c0c0e] text-white" value="BOTTOM_RIGHT">Bottom Right</option>'),
    ('<option value="CENTER">Center</option>', '<option className="bg-[#0c0c0e] text-white" value="CENTER">Center</option>'),
    ('<option value="NONE">No Watermark</option>', '<option className="bg-[#0c0c0e] text-white" value="NONE">No Watermark</option>'),
    
    # 4. Text sizes: Change inputs/selects from xs (12px) to sm (14px) or higher for better readability
    ('text-xs text-white focus:outline-none', 'text-sm text-white focus:outline-none'),
    ('text-xs text-slate-400 font-semibold', 'text-sm text-slate-300 font-medium'),
    ('text-xs text-slate-500 font-semibold', 'text-sm text-slate-300 font-medium'),
    ('text-xs text-gray-400 font-semibold', 'text-sm text-slate-300 font-medium'),
    ('text-xs text-slate-400', 'text-sm text-slate-300'),
    
    # 5. Dashboard empty states / prompts placeholder font color visibility
    ('text-slate-400 hover:text-white', 'text-slate-300 hover:text-white'),
    ('text-slate-500 hover:text-white', 'text-slate-300 hover:text-white'),
    ('text-slate-600', 'text-slate-300'),
    ('text-slate-700', 'text-slate-200'),
    ('text-slate-450', 'text-slate-350'),
    
    # Extra: Make sure select background style remains premium dark even when clicked
    ('w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white', 'w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white')
]

for target, replacement in replacements:
    content = content.replace(target, replacement)

# Write back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard fonts and contrast updated successfully!")
