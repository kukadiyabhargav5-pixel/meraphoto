import os

# Create scratch directory if not exists
os.makedirs("scratch", exist_ok=True)

pages_data = {
    # ── FEATURES ──
    "features/manage-event": {
        "title": "Instant Client Gallery Setup & Event Management",
        "badge": "Setup in Seconds",
        "description": "Streamline your photography studio workflow. Set up beautiful guest photo galleries in seconds and manage multiple sub-events inside a single event workspace.",
        "bullets": [
            "Create client galleries with rapid upload systems",
            "Organize event categories, folders, & sub-events",
            "Invite co-hosts or assistants as workspace collaborators"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black text-[#09090b]">mara photo</span>
          <span className="text-[8px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">• 4 active</span>
        </div>
        <div className="flex gap-3 flex-1 mt-2.5">
          <div className="w-[65px] border-r border-slate-50 pr-1 space-y-1 shrink-0 text-[7px] text-slate-400 font-bold">
            <div className="bg-[#09090b] text-white rounded p-1 flex items-center gap-1"><LayoutDashboard className="w-2 h-2" /> Dashboard</div>
            <div className="p-1 flex items-center gap-1"><Camera className="w-2 h-2" /> Events</div>
            <div className="p-1 flex items-center gap-1"><Settings className="w-2 h-2" /> Settings</div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-[9px] font-black text-[#c5a880]">Active Event Workspace ✨</p>
            <div className="border border-slate-100 rounded-lg p-1.5 space-y-1 bg-slate-50 relative">
              <div className="h-14 rounded overflow-hidden">
                <img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <p className="text-[8px] font-black text-slate-800">Couples Ceremony</p>
                  <p className="text-[6px] text-gray-400 font-semibold">26 May, 2026</p>
                </div>
                <span className="text-[5.5px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">Public</span>
              </div>
            </div>
          </div>
        </div>
      </div>
"""
    },
    "features/invoice-generator": {
        "title": "Professional Invoicing & Payment Automation",
        "badge": "GST Compliant Billing",
        "description": "Create and send premium branded invoices to clients instantly. Accept online payments, UPI, and track transaction status in real-time.",
        "bullets": [
            "Generate GST-compliant invoices in one click",
            "Accept secure digital payments and credit cards",
            "Automated payment reminders and tracking"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Studio Invoice</span>
          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Paid</span>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <div className="flex justify-between text-[8px] text-slate-400 font-semibold">
            <span>Bill To: Mehta Family</span>
            <span>Date: 24 May 2026</span>
          </div>
          <div className="border border-slate-100 rounded-lg p-2 bg-slate-50 space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-700">
              <span>Wedding Photography Cover</span>
              <span>₹85,000</span>
            </div>
            <div className="flex justify-between text-[7px] text-slate-400 font-medium">
              <span>Pre-Wedding + 2 Day Event Shoot</span>
              <span>Qty: 1</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
            <span className="text-[8px] text-slate-400 font-bold">Total Received</span>
            <span className="text-xs font-black text-slate-800">₹85,000</span>
          </div>
        </div>
      </div>
"""
    },
    "features/photographer-portfolio": {
        "title": "Stunning White-Label Portfolios",
        "badge": "Branded Portfolios",
        "description": "Showcase your best event work under your own custom domain. Give clients a high-end, premium gallery interface customized to match your studio logo.",
        "bullets": [
            "Map your custom domain (e.g. yourstudio.com)",
            "High-resolution, fast-loading modern layout grids",
            "Integrated client inquiry and booking forms"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="h-20 w-full overflow-hidden relative rounded-lg bg-slate-200">
          <img src="/portrait.jpg" alt="Portfolio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            <span className="text-[9px] bg-slate-900/90 text-[#c5a880] font-black px-3 py-1 rounded-full shadow-md">yourstudio.com</span>
          </div>
        </div>
        <div className="p-1 flex flex-col justify-between flex-1 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-black text-slate-700 uppercase tracking-wider">Featured Galleries</span>
            <span className="text-[6px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">View All</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" /></div>
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/party.jpg" alt="Party" className="w-full h-full object-cover" /></div>
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/gala.jpg" alt="Gala" className="w-full h-full object-cover" /></div>
          </div>
        </div>
      </div>
"""
    },
    "features/event-qr-code-gallery": {
        "title": "Instant Guest Access via QR Code Galleries",
        "badge": "Branded QR Cards",
        "description": "Generate high-resolution printable QR code table cards. Guests scan to instantly view their own personalized photos match results.",
        "bullets": [
            "Printable table cards and venue banner templates",
            "Seamless guest entry - no app installation needed",
            "Custom branding with your studio logo on QR templates"
        ],
        "mockup": """
      <div className="w-full bg-[#09090b] text-white rounded-xl shadow-lg border border-white/10 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a880]/10 rounded-full blur-xl" />
        <div className="space-y-0.5 z-10">
          <p className="text-[9px] font-black tracking-widest text-[#c5a880] uppercase">Scan to Find Your Photos</p>
          <p className="text-[6.5px] text-gray-400 font-semibold">Powered by Mara Photo AI</p>
        </div>
        <div className="bg-white p-2.5 rounded-xl inline-block mx-auto z-10 shadow-lg my-1.5">
          <QrCode className="w-14 h-14 text-[#09090b]" />
        </div>
        <div className="bg-[#c5a880] text-[#09090b] font-black text-[7.5px] rounded-lg py-1.5 uppercase tracking-widest z-10 max-w-[140px] mx-auto w-full">
          Scan QR Code
        </div>
      </div>
"""
    },
    "features/event-booking": {
        "title": "Simplified Studio Booking & Client Calendar",
        "badge": "Automated Booking",
        "description": "Allow prospective clients to book photo sessions directly on your calendar, sign digital contracts, and deposit advances seamlessly.",
        "bullets": [
            "Real-time calendar availability slots",
            "Collect deposits and token booking amounts online",
            "Smart contract signatures and auto-invoicing"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="border-b border-slate-100 pb-2">
          <p className="text-[9.5px] font-black text-slate-800">Select Date & Time</p>
          <p className="text-[6.5px] text-gray-400 font-semibold mt-0.5">Choose your event date below</p>
        </div>
        <div className="grid grid-cols-7 gap-1.5 my-2.5 text-center text-[7px] font-bold">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-slate-400">{d}</div>)}
          {Array.from({ length: 28 }).map((_, i) => (
            <div 
              key={i} 
              className={`p-1 rounded cursor-pointer ${
                i === 17 
                  ? 'bg-[#c5a880] text-[#09090b] font-black shadow-sm' 
                  : i === 12 || i === 19 
                    ? 'bg-slate-100 text-slate-300 pointer-events-none line-through' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="bg-[#faf9f6] border border-[#e3d8c8]/25 rounded-lg p-2 text-center text-[7.5px] font-bold text-[#c5a880] uppercase tracking-wider">
          May 18, 2026 • 09:00 AM Requested
        </div>
      </div>
"""
    },
    "features/event-face-recognition": {
        "title": "Ultra-Fast AI Face Recognition Matching",
        "badge": "0.5 Second Search",
        "description": "Guests take a quick selfie to instantly fetch their photos from among thousands of images. Secure, fast, and private facial search.",
        "bullets": [
            "Matches selfies with event galleries in 0.5 seconds",
            "High-precision facial recognition accuracy rates",
            "Complete client data security and search encryption"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] overflow-hidden select-none">
        <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 border-b border-slate-100 pb-1.5">
          <span>AI Scanning System</span>
          <span className="text-emerald-500 font-bold">• Active</span>
        </div>
        <div className="relative h-[120px] w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-0.5 mt-1">
          <img src="/guest_selfie.jpg" alt="Selfie Match" className="w-full h-full object-cover rounded-xl" />
          <div className="absolute inset-2 border-2 border-emerald-400 border-dashed rounded-full" />
        </div>
        <div className="text-[7.5px] text-slate-500 font-bold text-center mt-1">
          Serving matched photos instantly
        </div>
      </div>
"""
    },
    "features/wedding-website-template": {
        "title": "Elegant Custom Wedding Website Templates",
        "badge": "Invitation Mini-Sites",
        "description": "Create custom mini-sites for couples featuring their story, event location maps, countdown timers, and interactive RSVP guest registries.",
        "bullets": [
            "Gorgeous, pre-designed wedding layout themes",
            "Interactive RSVPs and live guest photo walls",
            "Share schedules and wedding details seamlessly"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 text-center font-poppins relative flex flex-col justify-between h-[240px] overflow-hidden select-none">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wedding Celebration</p>
          <p className="text-[13px] font-serif-luxury font-light text-[#09090b]">Raj & Priya</p>
        </div>
        <div className="h-20 rounded-lg overflow-hidden my-2 border border-slate-100">
          <img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-slate-700 text-center font-bold text-[7.5px]">
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">12</p><p className="text-[5.5px] text-slate-400">Days</p></div>
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">08</p><p className="text-[5.5px] text-slate-400">Hours</p></div>
          <div className="bg-slate-50 rounded p-1"><p className="text-[9px] font-black text-[#c5a880]">45</p><p className="text-[5.5px] text-slate-400">Mins</p></div>
        </div>
      </div>
"""
    },

    # ── USE CASES ──
    "use-cases/wedding-photography": {
        "title": "Luxury Live Galleries for Wedding Photographers",
        "badge": "Wedding Suite",
        "description": "Deliver a luxury wedding gallery experience. Guests search photos using selfies live at the venue, boosting social sharing and studio reach.",
        "bullets": [
            "Live image uploading directly from cameras",
            "Automatic selfie matching for wedding guests",
            "Branded couple websites with custom domains"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="space-y-0.5">
          <span className="text-[8px] bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Wedding Live</span>
          <p className="text-[12px] font-black text-slate-800 mt-1">Mehta Wedding Ceremony</p>
        </div>
        <div className="h-24 rounded-lg overflow-hidden border border-slate-100">
          <img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" />
        </div>
        <div className="text-[8px] text-slate-400 font-bold">
          2,450 Live Photos Uploaded
        </div>
      </div>
"""
    },
    "use-cases/corporate-photography": {
        "title": "Professional Delivery for Corporate Photography",
        "badge": "Corporate Events",
        "description": "Simplify corporate event photo sharing. Allow attendees to locate their event profile headshots instantly using our secure AI face index.",
        "bullets": [
            "Corporate branding with sponsor logos",
            "Strict privacy options - index searchable only",
            "Deliver thousands of corporate photos in minutes"
        ],
        "mockup": """
      <div className="w-full bg-[#09090b] text-white rounded-xl shadow-lg border border-white/10 p-4 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <span className="text-[10px] font-black tracking-widest text-[#c5a880] uppercase">Tech Summit 2026</span>
          <span className="text-[7px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">Corp</span>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <p className="text-[9px] font-bold text-slate-300">Attendee Image Search:</p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              <img src="/portrait.jpg" alt="Attendee" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-white">Pranav Shah</p>
              <p className="text-[6px] text-gray-400">Head of Engineering</p>
            </div>
          </div>
        </div>
      </div>
"""
    },
    "use-cases/parties-photography": {
        "title": "High-Energy Live Galleries for Parties",
        "badge": "Party & Nightlife",
        "description": "Let party guests search, view, and post high-res event highlights live to social media, generating massive word-of-mouth for your brand.",
        "bullets": [
            "Live uploading with instant selfie match",
            "Watermark branding with studio details",
            "Social sharing buttons on guest screens"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div>
          <span className="text-[8px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Live Party Feed</span>
          <p className="text-[12px] font-black text-slate-800 mt-1">Sunburn Festival Afterparty</p>
        </div>
        <div className="h-24 rounded-lg overflow-hidden border border-slate-100">
          <img src="/party.jpg" alt="Party" className="w-full h-full object-cover" />
        </div>
        <div className="text-[8px] text-[#c5a880] font-bold uppercase tracking-wider">
          Scan QR at DJ Booth to see
        </div>
      </div>
"""
    },
    "use-cases/school-college-event-photography": {
        "title": "Graduation & School Event Photo Delivery",
        "badge": "Academic Shoots",
        "description": "Deliver graduation photos cleanly. Parents and students find their ceremony portraits instantly in private galleries without sorting through thousands of folders.",
        "bullets": [
            "Private guest access options for student safety",
            "Generate sub-folders for departments or classes",
            "Collect direct high-res photo download payments"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="border-b border-slate-100 pb-2">
          <p className="text-[10px] font-black text-slate-800">Graduation Album 2026</p>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <div className="grid grid-cols-2 gap-2 text-[8px] font-bold">
            <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-center overflow-hidden h-[54px] flex items-center justify-center relative">
              <img src="/gala.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <span className="relative z-10">📂 MBA Batch</span>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-center overflow-hidden h-[54px] flex items-center justify-center relative">
              <img src="/portrait.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <span className="relative z-10">📂 BTech Batch</span>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center text-[7.5px] font-bold text-emerald-600">
            Secure Student Privacy Enabled
          </div>
        </div>
      </div>
"""
    },
    "use-cases/event-photography": {
        "title": "Premium Delivery for Professional Event Photographers",
        "badge": "All Event Types",
        "description": "From baby showers to festivals, Mara Photo gives professional event photographers the ultimate toolkit to deliver photos and automate client sales.",
        "bullets": [
            "Sleek and responsive white-label interfaces",
            "Auto payment collection and contracts",
            "Instant guest delivery with facial index systems"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div>
          <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium Event Delivery</span>
          <p className="text-[12px] font-black text-slate-800 mt-1">Baby Shower Ceremony</p>
        </div>
        <div className="h-24 rounded-lg overflow-hidden border border-slate-100">
          <img src="/gala.jpg" className="w-full h-full object-cover" />
        </div>
        <div className="text-[8px] text-slate-400 font-bold">
          Deliver client galleries instantly
        </div>
      </div>
"""
    }
}

# Add Special Pages (pricing, blog, about)
special_pages = {
    "pricing": {
        "title": "Simple, Symmetrical, & Transparent Pricing",
        "badge": "Pricing Plans",
        "description": "Choose the perfect plan for your photography studio. Upgrade or downgrade anytime. Get started with a free account.",
        "bullets": [
            "Starter Plan: Free forever - 1 Event gallery included",
            "Professional Plan: Best for studios - 25 Galleries & custom domain",
            "Enterprise: Unlimited events, dedicated storage, full white label"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="border-b border-slate-100 pb-2">
          <p className="text-[10px] font-black text-slate-800">Studio Plans</p>
        </div>
        <div className="space-y-1.5 flex-1 mt-2.5">
          <div className="bg-[#faf9f6] border border-[#e3d8c8]/20 rounded-lg p-2 flex justify-between items-center">
            <div><p className="text-[9px] font-black">Professional</p><p className="text-[6.5px] text-slate-400">Best Seller</p></div>
            <span className="text-xs font-black">₹4,999<span className="text-[7px] text-slate-400">/mo</span></span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center opacity-70">
            <div><p className="text-[9px] font-black text-slate-600">Starter</p><p className="text-[6.5px] text-slate-400">Free Account</p></div>
            <span className="text-xs font-black text-slate-600">₹0</span>
          </div>
        </div>
      </div>
"""
    },
    "about": {
        "title": "Delivering Experiences, Not Links",
        "badge": "About Mara Photo",
        "description": "Mara Photo is India's leading AI-powered guest gallery platform. We empower professional event photographers to automate delivery, simplify billing, and scale studios.",
        "bullets": [
            "Fastest guest face matching AI technology in India",
            "Loved by 600+ premium photography studios",
            "Committed to student privacy and corporate secure galleries"
        ],
        "mockup": """
      <div className="w-full bg-[#09090b] text-white rounded-xl shadow-lg border border-white/10 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a880]/10 rounded-full blur-xl" />
        <div className="space-y-1 mt-4">
          <span className="text-[9px] bg-[#c5a880]/15 text-[#c5a880] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[#c5a880]/20">Our Story</span>
          <p className="text-[12px] font-serif-luxury font-light text-white pt-2">Mara Photo Studio Tech</p>
        </div>
        <div className="text-[8px] text-gray-400 leading-relaxed max-w-[140px] mx-auto mb-4">
          Helping creators scale their business with premium cloud tools.
        </div>
      </div>
"""
    },
    "blog": {
        "title": "Photography Studio Insights & Advice",
        "badge": "Mara Photo Blog",
        "description": "Read tips and tricks on how to scale your photography studio, automate client deliverables, and handle invoice billing cleanly.",
        "bullets": [
            "How AI facial matching boosts studio referral leads",
            "Best practices for GST billing & client payment plans",
            "Mapping custom domains for white-label wedding subpages"
        ],
        "mockup": """
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="border-b border-slate-100 pb-2">
          <p className="text-[10px] font-black text-slate-800">Featured Articles</p>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <div className="border border-slate-100 rounded-lg p-1.5 bg-slate-50">
            <p className="text-[8px] font-black text-slate-800">How AI Boosts Referrals 🚀</p>
            <p className="text-[6.5px] text-[#c5a880] font-bold">5 min read • Tips</p>
          </div>
          <div className="border border-slate-100 rounded-lg p-1.5 bg-slate-50 opacity-70">
            <p className="text-[8px] font-black text-slate-800">Digital Invoice Reminders 💼</p>
          </div>
        </div>
      </div>
"""
    }
}

def generate_page(route, data):
    depth = len(route.split("/"))
    # Calculate depth relative path back to components
    rel_path = "../" * (depth + 1) + "components/PublicWrapper"
    
    bullets_js = "\n".join([
        f'''                    <li className="flex items-start gap-3" key={{{idx}}}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">{bullet}</span>
                    </li>''' 
        for idx, bullet in enumerate(data["bullets"])
    ])
    
    code_content = f"""'use client';

import React from 'react';
import PublicWrapper from '{rel_path}';
import Link from 'next/link';
import {{ ArrowRight, ChevronRight, QrCode, Calendar, ScanFace, Smile, Settings, CreditCard, Globe, LayoutDashboard, Camera }} from 'lucide-react';

export default function Page() {{
  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b]">
        
        {{/* Hero Section */}}
        <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-[#e3d8c8]/30">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 font-poppins shadow-sm">
              {data["badge"]}
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
              {data["title"]}
            </h1>
            <p className="font-poppins text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              {data["description"]}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Start Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-9 py-4 rounded-full hover:bg-slate-100 transition-all duration-300"
              >
                Consult Sales
              </Link>
            </div>
          </div>
        </section>

        {{/* Symmetrical Details Grid */}}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {{/* Left Column: Mockup wrapper */}}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[360px] bg-[#faf9f6] border border-slate-100 rounded-3xl p-3 shadow-md relative flex items-center justify-center min-h-[300px]">
                  {data["mockup"]}
                </div>
              </div>

              {{/* Right Column: Bullets */}}
              <div className="lg:col-span-7 space-y-8 text-left font-poppins">
                <div>
                  <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full">
                    Core Benefits
                  </span>
                  <h2 className="font-serif-luxury text-3xl sm:text-4xl font-light text-[#09090b] leading-tight mt-4">
                    Designed to give you <span className="italic text-[#c5a880]">complete control</span>
                  </h2>
                </div>

                <ul className="space-y-5">
{bullets_js}
                </ul>
              </div>

            </div>
          </div>
        </section>

        {{/* Call To Action Banner */}}
        <section className="bg-[#09090b] py-24 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-white">
              Ready to elevate your <span className="italic text-[#c5a880]">client experience?</span>
            </h2>
            <p className="text-gray-400 font-poppins text-sm sm:text-base max-w-lg mx-auto font-medium">
              Join elite photography studios delivering live moments instantly. Start free today.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-9 py-4 rounded-full transition-all duration-300 shadow-md"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </PublicWrapper>
  );
}}
"""
    return code_content

# Generate all pages
all_pages = {**pages_data, **special_pages}

for route, data in all_pages.items():
    folder_path = os.path.join("src", "app", route.replace("/", os.sep))
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, "page.tsx")
    code = generate_page(route, data)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Created page: {file_path}")

print("Success! Created all subpages.")
