const fs = require('fs');
const path = require('path');

const dashboardDir = 'src/app/dashboard';

const fixes = {
    'team': "  const [teamSubView, setTeamSubView] = useState('list');\n  const [newMemberName, setNewMemberName] = useState('');\n  const [newMemberEmail, setNewMemberEmail] = useState('');\n  const [newMemberRole, setNewMemberRole] = useState('Lead Photographer');\n",
    'order-booking': "  const [bookingSubView, setBookingSubView] = useState('list');\n  const [newBookingClient, setNewBookingClient] = useState('');\n  const [newBookingEvent, setNewBookingEvent] = useState('');\n  const [newBookingDate, setNewBookingDate] = useState('');\n  const [newBookingAmount, setNewBookingAmount] = useState('');\n",
    'quotation': "  const [quoteSubView, setQuoteSubView] = useState('list');\n  const [newQuoteClient, setNewQuoteClient] = useState('');\n  const [newQuoteEvent, setNewQuoteEvent] = useState('');\n  const [newQuoteAmount, setNewQuoteAmount] = useState('');\n",
    'bill': "  const [billSubView, setBillSubView] = useState('list');\n  const [newBillClient, setNewBillClient] = useState('');\n  const [newBillEvent, setNewBillEvent] = useState('');\n  const [newBillAmount, setNewBillAmount] = useState('');\n",
    'payment-qr': "  const [qrAmount, setQrAmount] = useState('');\n  const [qrNote, setQrNote] = useState('');\n",
    'profile': "  const [isEditingProfile, setIsEditingProfile] = useState(false);\n  const [editName, setEditName] = useState('');\n  const [editEmail, setEditEmail] = useState('');\n  const [editPhone, setEditPhone] = useState('');\n  const [editRole, setEditRole] = useState('');\n",
    'studio-branding': "  const [brandName, setBrandName] = useState('');\n  const [brandColor, setBrandColor] = useState('#c5a880');\n  const [brandLogo, setBrandLogo] = useState(null);\n  const [brandDomain, setBrandDomain] = useState('');\n  const [brandWatermark, setBrandWatermark] = useState('');\n",
    'plans-billing': "  const [billingCycle, setBillingCycle] = useState('monthly');\n",
    'support-help': "  const [supportSubView, setSupportSubView] = useState('list');\n  const [ticketSubject, setTicketSubject] = useState('');\n  const [ticketMessage, setTicketMessage] = useState('');\n",
};

for (const [folder, states] of Object.entries(fixes)) {
    const filePath = path.join(dashboardDir, folder, 'page.tsx');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (!content.includes("successMsg, setSuccessMsg")) {
            content = content.replace("tickets, setTickets,", "tickets, setTickets,\n    successMsg, setSuccessMsg,\n    errorMsg, setErrorMsg\n");
            content = content.replace("// Add other needed states here", "");
        }
        
        const firstStateLine = states.split('\\n')[0].trim();
        if (!content.includes(firstStateLine)) {
            content = content.replace('  return (', states + '\n  return (');
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${folder}`);
    } else {
        console.log(`File not found for ${folder}`);
    }
}
