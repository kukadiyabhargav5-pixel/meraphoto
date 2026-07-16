import re

file_path = "src/app/dashboard/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace logo wrapper and style
content = content.replace(
    '<div className="bg-transparent border border-white/10 rounded-xl p-2.5 inline-flex w-full justify-center shadow-sm">\n              <img src="/logo.jpg" alt="Mara Photo Logo" className="max-h-12 w-auto object-contain filter invert brightness-200" />\n            </div>',
    '<div className="flex items-center justify-center w-full py-2">\n              <img src="/logo.jpg" alt="Mara Photo Logo" className="max-h-11 w-auto object-contain filter invert" />\n            </div>'
)

# 2. Inject explicit class styling into all dropdown option tags so they display dark dropdown blocks with white text on all browsers
# We find any <option value="..."> or <option> tags and replace them with <option className="bg-[#0c0c0e] text-white" value="...">
content = re.sub(
    r'<option([^>]*?)value="([^"]+?)"([^>]*?)>',
    r'<option\1className="bg-[#0c0c0e] text-white" value="\2"\3>',
    content
)
# For option tags without value attribute (like plain option tags)
content = re.sub(
    r'<option([^>]*?)>',
    lambda m: m.group(0) if "className" in m.group(0) else m.group(0).replace("<option", '<option className="bg-[#0c0c0e] text-white"'),
    content
)

# 3. Update the select inputs to enforce dark backgrounds for their dropdown choices
# We can also add styling to the selects:
# Let's replace native select components to make sure they have a dark background dropdown panel
content = content.replace(
    'className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880] focus:bg-white/[0.04]"',
    'className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"'
)
content = content.replace(
    'className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"',
    'className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"'
)
content = content.replace(
    'className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-805 focus:outline-none focus:border-[#c5a880] focus:bg-white/[0.04]"',
    'className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"'
)
content = content.replace(
    'className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-805 focus:outline-none focus:border-[#c5a880]"',
    'className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"'
)

# 4. Convert pricing details inside billing tab to Rupees (₹)
content = content.replace(
    "{ name: 'STARTER', price: '$0/mo', desc: 'Starter features, max 5 events.' }",
    "{ name: 'STARTER', price: '₹0/mo', desc: 'Starter features, max 5 events.' }"
)
content = content.replace(
    "{ name: 'PROFESSIONAL', price: '$29/mo', desc: 'Max 20 events, AI matches.' }",
    "{ name: 'PROFESSIONAL', price: '₹996/mo', desc: 'Max 20 events, AI matches.' }"
)
content = content.replace(
    "{ name: 'BUSINESS', price: '$79/mo', desc: 'Unlimited events, WhatsApp invites.' }",
    "{ name: 'BUSINESS', price: '₹7,116/yr', desc: 'Unlimited events, WhatsApp invites.' }"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Logo, option drop-downs, and Rupees prices updated successfully!")
