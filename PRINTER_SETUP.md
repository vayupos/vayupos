# VayuPOS Printer Setup Guide

VayuPOS uses **browser-based printing** — no software installation required at the restaurant. The cashier's device sends print jobs directly through the browser to any connected printer.

---

## How It Works

1. Cashier places an order on the POS page
2. The browser automatically opens a print window for the customer bill
3. The kitchen screen (KOT page) shows all active orders — staff can reprint any ticket using the **Print** button
4. The browser uses the system's default printer for each print job

---

## Supported Printer Connection Types

| Type | How to connect |
|---|---|
| **USB** | Plug into the device running VayuPOS — set as default printer in Windows/macOS |
| **WiFi / LAN** | Connect printer to the same WiFi network — add via Windows Settings → Printers → Add a printer |
| **Bluetooth** | Pair via OS Bluetooth settings — appears as a printer in Windows/macOS |

---

## Step-by-Step Setup (Windows)

### 1. USB Printer
1. Plug the thermal printer into a USB port
2. Windows auto-installs the driver (or download from manufacturer's site)
3. Go to **Settings → Bluetooth & devices → Printers & scanners**
4. Set the thermal printer as **Default printer**
5. Open VayuPOS → POS page → place an order → print dialog will use this printer

### 2. WiFi / Network Printer
1. Connect the printer to your WiFi router (via Ethernet or printer's WiFi setup)
2. Note the printer's IP address (check the printer's network report page)
3. Go to **Settings → Bluetooth & devices → Printers & scanners → Add a printer**
4. Choose **Add a printer by IP address or hostname**
5. Enter the printer IP (e.g. `192.168.1.100`)
6. Set as default printer
7. Test print from VayuPOS

### 3. Bluetooth Printer
1. Turn on the printer and enable Bluetooth pairing mode
2. Go to **Settings → Bluetooth & devices → Add device → Bluetooth**
3. Select the printer from the list
4. Once paired it appears under Printers — set as default

---

## Recommended Paper Width

- **80mm** — standard receipt/KOT paper (recommended)
- **58mm** — smaller portable printers

Set your preferred width in VayuPOS → **Settings → Printer Settings**.

---

## Popular Compatible Printers

- Epson TM-T82 / TM-T88 series (USB + LAN)
- Star TSP100 / TSP650 (USB + LAN + Bluetooth)
- SEWOO / Xprinter XP-80 (USB + WiFi)
- Any ESC/POS compatible 80mm thermal printer

---

## Troubleshooting

**Print dialog doesn't open?**
- Browser is blocking pop-ups. Click the pop-up blocked icon in the address bar and allow pop-ups for the VayuPOS domain.

**Wrong printer selected?**
- In the browser print dialog, use the **Destination** dropdown to select the correct thermal printer.

**Paper size wrong?**
- In the print dialog, set paper size to match your printer roll (80mm = ~3.15 inches wide).
- Disable headers/footers and set margins to None for a clean receipt.

**Print is cut off?**
- Set scale to 100% (not "Fit to page") in the print dialog.
