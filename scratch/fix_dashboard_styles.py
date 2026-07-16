import re

file_path = "src/app/dashboard/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's perform systematically structured replacements for a premium luxury dark mode dashboard
replacements = [
    # 1. Main Outer Background & text
    ('bg-[#F8FAFC]', 'bg-[#09090b]'),
    ('text-[#0F172A]', 'text-[#faf9f6]'),
    ('bg-[#F1F5F9]', 'bg-[#0c0c0e]'),
    ('text-slate-800', 'text-white'),
    ('text-slate-900', 'text-white'),
    ('text-gray-900', 'text-white'),
    ('text-gray-800', 'text-white'),

    # 2. Card Backgrounds: bg-white inside main dashboard
    # We want to change light bg-white cards inside main panel to white/[0.02] dark panels
    ('bg-white border border-slate-200 hover:border-[#FF6B00]', 'bg-white/[0.02] border border-white/10 hover:border-[#c5a880]'),
    ('bg-white border border-slate-200', 'bg-white/[0.02] border border-white/10'),
    ('bg-white p-6 rounded-2xl border border-slate-200', 'bg-white/[0.02] p-6 rounded-2xl border border-white/10'),
    ('bg-white rounded-2xl border border-slate-200', 'bg-white/[0.02] rounded-2xl border border-white/10'),
    ('bg-white border border-slate-100', 'bg-white/[0.02] border border-white/10'),
    ('bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100', 'bg-[#0c0c0e] rounded-3xl p-6 md:p-8 max-w-lg w-full border border-white/10'),
    ('bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-100', 'bg-[#0c0c0e] rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-white/10'),
    ('bg-white rounded-3xl p-8 md:p-10 border border-[#e3d8c8]/30', 'bg-white/[0.02] rounded-3xl p-8 md:p-10 border border-white/10'),
    
    # 3. Dynamic background colors
    ('bg-slate-50', 'bg-white/[0.02]'),
    ('bg-slate-100', 'bg-white/[0.04]'),
    ('bg-slate-200', 'bg-white/[0.06]'),
    ('bg-slate-300', 'bg-white/[0.08]'),
    
    # 4. Border adjustments
    ('border-slate-200', 'border-white/10'),
    ('border-slate-100', 'border-white/5'),
    ('border-gray-200', 'border-white/10'),
    ('border-gray-100', 'border-white/5'),
    ('divide-slate-100', 'divide-white/5'),
    ('divide-gray-100', 'divide-white/5'),
    ('border-[#e3d8c8]/30', 'border-white/10'),
    ('border-slate-300', 'border-white/10'),

    # 5. Text colors overrides
    ('text-slate-700', 'text-slate-200'),
    ('text-gray-700', 'text-slate-200'),
    ('text-slate-600', 'text-slate-300'),
    ('text-gray-600', 'text-slate-300'),
    ('text-slate-500', 'text-slate-400'),
    ('text-gray-500', 'text-slate-400'),
    ('text-slate-400', 'text-slate-400'),
    ('text-gray-400', 'text-slate-400'),

    # 6. Orange accent theme overrides to Gold accent theme
    ('#FF6B00', '#c5a880'),
    ('text-[#FF6B00]', 'text-[#c5a880]'),
    ('bg-[#FF6B00]', 'bg-[#c5a880] text-[#09090b]'),
    ('bg-[#FF6B00]/10', 'bg-[#c5a880]/10 text-[#c5a880]'),
    ('border-orange-100', 'border-[#c5a880]/10'),
    ('border-orange-200', 'border-[#c5a880]/20'),
    ('text-orange-600', 'text-[#c5a880]'),
    ('bg-orange-50', 'bg-[#c5a880]/10 text-[#c5a880]'),
    ('hover:bg-orange-100', 'hover:bg-[#c5a880]/20'),
    ('bg-orange-600', 'bg-[#c5a880] text-[#09090b]'),
    ('hover:bg-orange-700', 'hover:bg-white'),
    ('hover:bg-orange-50', 'hover:bg-white/5'),
    ('indigo-600', '#c5a880'),
    ('indigo-500', '#c5a880'),
    ('indigo-700', 'white'),
    ('bg-indigo-600', 'bg-[#c5a880] text-[#09090b]'),
    ('bg-indigo-50', 'bg-[#c5a880]/10 text-[#c5a880]'),
    ('text-indigo-600', 'text-[#c5a880]'),

    # 7. Form inputs premium design
    ('bg-slate-50 border border-slate-200', 'bg-white/[0.02] border border-white/10 text-white'),
    ('focus:border-[#FF6B00]', 'focus:border-[#c5a880]'),
    ('focus:ring-[#FF6B00]', 'focus:ring-[#c5a880]'),
    ('focus:border-indigo-500', 'focus:border-[#c5a880]'),
    ('focus:ring-indigo-500', 'focus:ring-[#c5a880]'),
    
    # 8. Tables and special components
    ('bg-gray-50', 'bg-white/[0.01]'),
    ('bg-gray-100', 'bg-white/[0.03]'),
    ('hover:bg-slate-50', 'hover:bg-white/[0.02]'),
    ('hover:bg-gray-50', 'hover:bg-white/[0.02]'),
    ('text-slate-350', 'text-slate-300'),
    ('text-slate-450', 'text-slate-400')
]

# Let's execute replacements sequentially
for target, replacement in replacements:
    content = content.replace(target, replacement)

# Write back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully converted dashboard to dark obsidian luxury theme!")
