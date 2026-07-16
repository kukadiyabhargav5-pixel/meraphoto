import os
import re

dashboard_dir = 'src/app/dashboard'

fixes = {
    'team': "  const [teamSubView, setTeamSubView] = useState('list');\n  const [newMemberName, setNewMemberName] = useState('');\n  const [newMemberEmail, setNewMemberEmail] = useState('');\n  const [newMemberRole, setNewMemberRole] = useState('Lead Photographer');\n",
    'order-booking': "  const [bookingSubView, setBookingSubView] = useState('list');\n  const [newBookingClient, setNewBookingClient] = useState('');\n  const [newBookingEvent, setNewBookingEvent] = useState('');\n  const [newBookingDate, setNewBookingDate] = useState('');\n  const [newBookingAmount, setNewBookingAmount] = useState('');\n",
    'quotation': "  const [quoteSubView, setQuoteSubView] = useState('list');\n  const [newQuoteClient, setNewQuoteClient] = useState('');\n  const [newQuoteEvent, setNewQuoteEvent] = useState('');\n  const [newQuoteAmount, setNewQuoteAmount] = useState('');\n",
    'bill': "  const [billSubView, setBillSubView] = useState('list');\n  const [newBillClient, setNewBillClient] = useState('');\n  const [newBillEvent, setNewBillEvent] = useState('');\n  const [newBillAmount, setNewBillAmount] = useState('');\n",
    'payment-qr': "  const [qrAmount, setQrAmount] = useState('');\n  const [qrNote, setQrNote] = useState('');\n",
    'profile': "  const [isEditingProfile, setIsEditingProfile] = useState(false);\n  const [editName, setEditName] = useState('');\n  const [editEmail, setEditEmail] = useState('');\n  const [editPhone, setEditPhone] = useState('');\n  const [editRole, setEditRole] = useState('');\n",
    'studio-branding': "  const [brandName, setBrandName] = useState('');\n  const [brandColor, setBrandColor] = useState('#c5a880');\n  const [brandLogo, setBrandLogo] = useState(null);\n  const [brandDomain, setBrandDomain] = useState('');\n  const [brandWatermark, setBrandWatermark] = useState('');\n",
    'plans-billing': "  const [billingCycle, setBillingCycle] = useState('monthly');\n",
    'support-help': "  const [supportSubView, setSupportSubView] = useState('list');\n  const [ticketSubject, setTicketSubject] = useState('');\n  const [ticketMessage, setTicketMessage] = useState('');\n",
}

for folder, states in fixes.items():
    file_path = os.path.join(dashboard_dir, folder, 'page.tsx')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Add successMsg and errorMsg to context extraction
        if "successMsg, setSuccessMsg" not in content:
            content = content.replace("tickets, setTickets,", "tickets, setTickets,\n    successMsg, setSuccessMsg,\n    errorMsg, setErrorMsg\n")
            content = content.replace("// Add other needed states here", "")
            
        # Add local states before the return statement
        if states.split('\\n')[0].strip() not in content:
            content = content.replace('  return (', states + '\n  return (')
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {folder}")
    else:
        print(f"File not found for {folder}")
