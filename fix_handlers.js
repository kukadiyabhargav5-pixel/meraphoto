const fs = require('fs');
const path = require('path');

const brandingPath = path.join(__dirname, 'src/app/dashboard/studio-branding/page.tsx');
let content = fs.readFileSync(brandingPath, 'utf8');

const missingBranding = `
  const handleUpdateBranding = (e: any) => { e.preventDefault(); setSuccessMsg('Branding updated (Dummy)'); };
  const [studioName, setStudioName] = useState('Mara Photo');
  const [studioLogo, setStudioLogo] = useState('');
  const [uploadingAsset, setUploadingAsset] = useState('');
  const handleAssetUpload = (e: any, setter: any, type: string) => { setUploadingAsset(type); setTimeout(() => setUploadingAsset(''), 1000); };
  const [studioSubdomain, setStudioSubdomain] = useState('studio');
  const [studioCustomDomain, setStudioCustomDomain] = useState('');
  const [wmType, setWmType] = useState('NONE');
  const [wmText, setWmText] = useState('');
  const [wmLogo, setWmLogo] = useState('');
  const [wmPos, setWmPos] = useState('BOTTOM_RIGHT');
  const [wmOpacity, setWmOpacity] = useState(0.5);
`;
if (!content.includes('handleUpdateBranding')) {
  content = content.replace('  const [brandName', missingBranding + '  const [brandName');
  fs.writeFileSync(brandingPath, content);
  console.log("Fixed branding");
}

const profilePath = path.join(__dirname, 'src/app/dashboard/profile/page.tsx');
if (fs.existsSync(profilePath)) {
  let profile = fs.readFileSync(profilePath, 'utf8');
  const missingProfile = `
  const handleUpdateProfile = (e: any) => { e.preventDefault(); setSuccessMsg('Profile updated (Dummy)'); };
  `;
  if (!profile.includes('handleUpdateProfile')) {
    profile = profile.replace('  const [isEditingProfile', missingProfile + '  const [isEditingProfile');
    fs.writeFileSync(profilePath, profile);
    console.log("Fixed profile");
  }
}

const supportPath = path.join(__dirname, 'src/app/dashboard/support-help/page.tsx');
if (fs.existsSync(supportPath)) {
  let support = fs.readFileSync(supportPath, 'utf8');
  const missingSupport = `
  const handleCreateTicket = (e: any) => { e.preventDefault(); setSuccessMsg('Ticket submitted (Dummy)'); };
  `;
  if (!support.includes('handleCreateTicket')) {
    support = support.replace('  const [supportSubView', missingSupport + '  const [supportSubView');
    fs.writeFileSync(supportPath, support);
    console.log("Fixed support");
  }
}
