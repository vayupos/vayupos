import React, { useState } from 'react';
import { Bluetooth, WifiOff, Search, Save, Printer, Info, Zap, RotateCw, CheckCircle, XCircle, Edit2, X } from 'lucide-react';

const KOTPrinterSettings = () => {
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [testPrintStatus, setTestPrintStatus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [activePrinter, setActivePrinter] = useState({
    name: 'BT-P58A',
    mac: 'AA:4C:12:8F:22:91',
    connected: true
  });

  const [settings, setSettings] = useState({
    paperWidth: '58mm / 80mm',
    characterSet: 'Auto (UTF-8)',
    density: 'Normal',
    headerText: 'Your Shop Name',
    footerText: 'Thank you! Visit again',
    showGST: true,
    cutMode: 'No cutter',
    printCopies: '1',
    fontSize: 'Small'
  });

  const [availableDevices] = useState([
    { name: 'BT-P58A', mac: 'AA:4C:12:8F:22:91', connected: false },
    { name: 'RPP02', mac: '5C:1D:77:0A:3B:4E', connected: false },
    { name: 'POS-58', mac: '64:52:A1:60:CD:90', connected: false }
  ]);

  const handleStartScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 2000);
  };

  const handleConnect = (device) => {
    setActivePrinter({ ...device, connected: true });
  };

  const handleDisconnect = () => {
    setActivePrinter({ ...activePrinter, connected: false });
  };

  const handleTestPrint = async () => {
    // Show preview popup instead of printing
    setShowPrintPreview(true);
  };

  const handleActualPrint = async () => {
    setTestPrintStatus('loading');
    
    try {
      console.log('Sending test print to printer:', activePrinter.name);
      console.log('Printer settings:', settings);
      
      const kotData = {
        header: settings.headerText,
        orderNumber: '#1027',
        orderType: 'Dine-in',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        items: [
          { name: 'Paneer Roll', quantity: 1, price: 120 },
          { name: 'Masala Chai', quantity: 2, price: 80 }
        ],
        notes: 'No onion',
        footer: settings.footerText,
        totalItems: 3
      };
      
      console.log('KOT Data to print:', kotData);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!activePrinter.connected) {
        throw new Error('Printer not connected');
      }
      
      setTestPrintStatus('success');
      alert(`✅ Test Print Successful!\n\nPrinter: ${activePrinter.name}\nMAC: ${activePrinter.mac}\n\nA test KOT has been sent to your printer.`);
      setTimeout(() => setTestPrintStatus(null), 3000);
      setShowPrintPreview(false);
      
    } catch (error) {
      console.error('Print error:', error);
      setTestPrintStatus('error');
      alert(`❌ Test Print Failed!\n\nError: ${error.message}\n\nPlease check:\n- Printer is powered on\n- Bluetooth connection is stable\n- Paper is loaded`);
      setTimeout(() => setTestPrintStatus(null), 3000);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('loading');
    
    try {
      console.log('Saving printer settings...');
      console.log('Settings to save:', settings);
      
      if (!settings.headerText.trim()) {
        throw new Error('Header text cannot be empty');
      }
      
      if (!settings.footerText.trim()) {
        throw new Error('Footer text cannot be empty');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      localStorage.setItem('kotPrinterSettings', JSON.stringify(settings));
      localStorage.setItem('activePrinter', JSON.stringify(activePrinter));
      
      setSaveStatus('success');
      alert(`✅ Settings Saved Successfully!\n\nPrinter: ${activePrinter.name}\nPaper Width: ${settings.paperWidth}\nFont Size: ${settings.fontSize}\n\nYour KOT printer is ready to use.`);
      setTimeout(() => setSaveStatus(null), 3000);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      alert(`❌ Failed to Save Settings!\n\nError: ${error.message}\n\nPlease try again.`);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const filteredDevices = availableDevices.filter(device => 
    searchQuery === '' ||
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.mac.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-350 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[26px] font-bold text-foreground">KOT Printer Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Printer Settings */}
          <div className="space-y-6">
            {/* Bluetooth Devices */}
            <div className="rounded-lg px-5 py-5 bg-card border border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-foreground">Bluetooth Devices</h2>
                <button
                  onClick={handleStartScan}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={scanning}
                >
                  <RotateCw size={16} className={scanning ? 'animate-spin' : ''} />
                  <span className="text-[14px]">{scanning ? 'Scanning...' : 'Start Scan'}</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                  <input
                    type="text"
                    placeholder="Printer name or MAC"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-[15px] pl-11 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Device List */}
              <div className="space-y-3">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => (
                    <div 
                      key={device.mac} 
                      className="flex items-center justify-between py-3 px-3 rounded-lg border-b border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Bluetooth size={18} className="text-foreground" />
                        <div>
                          <div className="font-semibold text-[16px] text-foreground">{device.name}</div>
                          <div className="text-[13px] text-muted-foreground">{device.mac}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(device)}
                        className="px-4 py-1.5 rounded-lg font-medium transition-colors text-[14px] flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Bluetooth size={14} />
                        Connect
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[14px] text-muted-foreground">No devices found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-[13px] text-muted-foreground pl-2">
                <Info size={14} className="inline mr-2" />
                Tip: Keep the printer powered on and near your device for a faster discovery.
              </div>
            </div>

            {/* Active Printer */}
            {activePrinter.connected && (
              <div className="rounded-lg px-5 py-5 bg-card border border-border">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[18px] font-bold mb-1 text-foreground">Active Printer</h2>
                    <span className="inline-block px-3 py-1 rounded-full text-[12px] font-medium bg-primary text-primary-foreground">
                      Bluetooth
                    </span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-[14px] bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>

                {/* Printer Info */}
                <div className="flex items-center justify-between p-4 rounded-lg mb-5 bg-muted border border-border">
                  <div className="flex items-center gap-3">
                    <Printer size={20} className="text-foreground" />
                    <div>
                      <div className="font-semibold text-[16px] text-foreground">{activePrinter.name}</div>
                      <div className="text-[13px] text-muted-foreground">Connected • {activePrinter.mac}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-1.5 rounded-lg font-medium transition-colors text-[14px] flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <WifiOff size={14} />
                    Disconnect
                  </button>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Paper Width</label>
                    <input
                      type="text"
                      value={settings.paperWidth}
                      onChange={(e) => setSettings({...settings, paperWidth: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Character Set</label>
                    <input
                      type="text"
                      value={settings.characterSet}
                      onChange={(e) => setSettings({...settings, characterSet: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Density</label>
                    <input
                      type="text"
                      value={settings.density}
                      onChange={(e) => setSettings({...settings, density: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Header Text</label>
                    <input
                      type="text"
                      value={settings.headerText}
                      onChange={(e) => setSettings({...settings, headerText: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Footer Text</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Show GST</label>
                    <input
                      type="text"
                      value="Enabled"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px]"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Cut Mode</label>
                    <input
                      type="text"
                      value={settings.cutMode}
                      onChange={(e) => setSettings({...settings, cutMode: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] mb-2 text-muted-foreground">Print Copies</label>
                    <input
                      type="text"
                      value={settings.printCopies}
                      onChange={(e) => setSettings({...settings, printCopies: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[14px] mb-2 text-muted-foreground">Font Size</label>
                  <input
                    type="text"
                    value={settings.fontSize}
                    onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleTestPrint}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors text-[14px] bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Printer size={16} />
                    Test Print
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={saveStatus === 'loading'}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors text-[14px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveStatus === 'loading' ? (
                        <>
                          <RotateCw size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Settings
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Kitchen Ticket Preview */}
          <div className="rounded-lg px-5 py-5 bg-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-foreground">Kitchen Ticket Preview</h2>
              <span className="text-[13px] text-muted-foreground">Static preview of how your KOT will look</span>
            </div>

            <div className="space-y-5">
              {/* Sample KOT */}
              <div>
                <h3 className="text-[16px] font-bold mb-4 text-foreground">Sample KOT</h3>
                <div className="rounded-lg p-4 bg-muted border border-border">
                  <div className="text-center mb-4">
                    <h4 className="text-[17px] font-bold text-foreground">{settings.headerText}</h4>
                    <p className="text-[14px] mt-1 text-muted-foreground">Order #1027 • Dine-in • 10:42 AM</p>
                  </div>

                  <div className="space-y-3 mb-4 border-t border-dashed border-border pt-3">
                    <div className="flex justify-between">
                      <span className={`font-semibold text-foreground ${
                        settings.fontSize === 'Small' ? 'text-[13px]' : 
                        settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                      }`}>1x Paneer Roll</span>
                      <span className={`text-foreground ${
                        settings.fontSize === 'Small' ? 'text-[13px]' : 
                        settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                      }`}>₹120</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-semibold text-foreground ${
                        settings.fontSize === 'Small' ? 'text-[13px]' : 
                        settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                      }`}>2x Masala Chai</span>
                      <span className={`text-foreground ${
                        settings.fontSize === 'Small' ? 'text-[13px]' : 
                        settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                      }`}>₹80</span>
                    </div>
                    <div className="text-[14px] text-muted-foreground">
                      <span className="font-semibold">Notes</span>
                      <p className="mt-1">No onion</p>
                    </div>
                  </div>

                  {settings.showGST && (
                    <div className="mb-3 pb-3 border-b border-dashed border-border">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">GST (5%)</span>
                        <span className="text-foreground">₹10</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-dashed border-border">
                    <div className="flex justify-between">
                      <span className="text-[15px] font-bold text-foreground">Total Items</span>
                      <span className="text-[15px] font-bold text-foreground">3</span>
                    </div>
                  </div>

                  <div className="text-center mt-4 pt-3 border-t border-dashed border-border">
                    <p className="text-[13px] text-muted-foreground">{settings.footerText}</p>
                  </div>
                </div>
              </div>

              {/* Printing Tips */}
              <div>
                <h3 className="text-[16px] font-bold mb-4 text-foreground">Printing Tips</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Info size={18} className="shrink-0 mt-1 text-muted-foreground" />
                    <p className="text-[14px] text-muted-foreground">
                      Use 58mm paper for compact KOTs. Enable bold for item names if readability is low.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Zap size={18} className="shrink-0 mt-1 text-muted-foreground" />
                    <p className="text-[14px] text-muted-foreground">
                      Bluetooth may drop when printer sleeps. Wake the printer and hit Test Print.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Popup */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 relative border border-border">
            <button
              onClick={() => setShowPrintPreview(false)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} className="text-foreground" />
            </button>

            <h3 className="text-[20px] font-bold mb-4 text-foreground">Print Preview</h3>

            {/* KOT Preview */}
            <div className="rounded-lg p-4 bg-muted border border-border mb-5">
              <div className="text-center mb-4">
                <h4 className="text-[17px] font-bold text-foreground">{settings.headerText}</h4>
                <p className="text-[14px] mt-1 text-muted-foreground">Order #1027 • Dine-in • 10:42 AM</p>
              </div>

              <div className="space-y-3 mb-4 border-t border-dashed border-border pt-3">
                <div className="flex justify-between">
                  <span className={`font-semibold text-foreground ${
                    settings.fontSize === 'Small' ? 'text-[13px]' : 
                    settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                  }`}>1x Paneer Roll</span>
                  <span className={`text-foreground ${
                    settings.fontSize === 'Small' ? 'text-[13px]' : 
                    settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                  }`}>₹120</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-semibold text-foreground ${
                    settings.fontSize === 'Small' ? 'text-[13px]' : 
                    settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                  }`}>2x Masala Chai</span>
                  <span className={`text-foreground ${
                    settings.fontSize === 'Small' ? 'text-[13px]' : 
                    settings.fontSize === 'Medium' ? 'text-[15px]' : 'text-[17px]'
                  }`}>₹80</span>
                </div>
                <div className="text-[14px] text-muted-foreground">
                  <span className="font-semibold">Notes</span>
                  <p className="mt-1">No onion</p>
                </div>
              </div>

              {settings.showGST && (
                <div className="mb-3 pb-3 border-b border-dashed border-border">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span className="text-foreground">₹10</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-dashed border-border">
                <div className="flex justify-between">
                  <span className="text-[15px] font-bold text-foreground">Total Items</span>
                  <span className="text-[15px] font-bold text-foreground">3</span>
                </div>
              </div>

              <div className="text-center mt-4 pt-3 border-t border-dashed border-border">
                <p className="text-[13px] text-muted-foreground">{settings.footerText}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors text-[14px] bg-muted text-foreground hover:bg-muted/80 border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleActualPrint}
                disabled={testPrintStatus === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors text-[14px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testPrintStatus === 'loading' ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={16} />
                    Print
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KOTPrinterSettings;