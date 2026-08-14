/**
 * Utilities for ESC/POS Bluetooth Thermal Printing, RawBT Intent Integration, and Receipt Formatting
 * Compatible with RawBT Print Service App and standard 58mm / 80mm ESC/POS Thermal Printers
 */

export interface ReceiptData {
  storeName: string;
  agentAddress: string;
  phone?: string;
  trxId: string;
  dateStr: string;
  platform: string;
  jenis: string;
  pelanggan: string;
  nominal: number;
  biayaAdmin: number;
  totalBayar: number;
  status: string;
  note: string;
  logoBase64?: string;
  showLogo?: boolean;
}

// Convert Base64 image to ESC/POS Monochrome Bitmap Bytes (GS v 0)
export async function imageToEscPosBitmap(
  base64Src: string,
  maxWidth = 384
): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Fit width to thermal paper (384px for 58mm, 576px for 80mm)
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        // Width must be multiple of 8
        width = Math.floor(width / 8) * 8;
        if (width <= 0 || height <= 0) {
          resolve(null);
          return;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Grayscale conversion and thresholding (monochrome)
        const bytesPerLine = width / 8;
        const bitmapBytes = new Uint8Array(bytesPerLine * height);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Luminance
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const isBlack = gray < 128;

            if (isBlack) {
              const byteIdx = y * bytesPerLine + Math.floor(x / 8);
              const bitOffset = 7 - (x % 8);
              bitmapBytes[byteIdx] |= 1 << bitOffset;
            }
          }
        }

        // Build ESC/POS raster bit image command (GS v 0 m xL xH yL yH d1...dk)
        const xL = bytesPerLine % 256;
        const xH = Math.floor(bytesPerLine / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);

        const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        const fullCommand = new Uint8Array(header.length + bitmapBytes.length);
        fullCommand.set(header, 0);
        fullCommand.set(bitmapBytes, header.length);

        resolve(fullCommand);
      };
      img.onerror = () => resolve(null);
      img.src = base64Src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generate full ESC/POS binary command buffer
 */
export async function generateEscPosBuffer(
  data: ReceiptData,
  is80mm = false
): Promise<Uint8Array> {
  const lineLength = is80mm ? 48 : 32;
  const divider = '-'.repeat(lineLength) + '\n';
  const doubleDivider = '='.repeat(lineLength) + '\n';

  const chunks: Uint8Array[] = [];

  const addText = (text: string) => {
    const encoder = new TextEncoder();
    chunks.push(encoder.encode(text));
  };

  const addBytes = (bytes: number[]) => {
    chunks.push(new Uint8Array(bytes));
  };

  const formatTwoCol = (left: string, right: string) => {
    const spaceCount = Math.max(1, lineLength - left.length - right.length);
    return left + ' '.repeat(spaceCount) + right + '\n';
  };

  // 1. Initialize Printer (ESC @)
  addBytes([0x1b, 0x40]);

  // 2. Logo if present & enabled
  if (data.showLogo && data.logoBase64) {
    const maxWidth = is80mm ? 576 : 384;
    const logoBytes = await imageToEscPosBitmap(data.logoBase64, Math.min(maxWidth, 240));
    if (logoBytes) {
      addBytes([0x1b, 0x61, 0x01]); // Align Center
      chunks.push(logoBytes);
      addBytes([0x0a]); // Line Feed
    }
  }

  // 3. Store Header (Center aligned)
  addBytes([0x1b, 0x61, 0x01]); // Align Center
  addBytes([0x1b, 0x45, 0x01]); // Bold On
  addBytes([0x1d, 0x21, 0x11]); // Double width & height
  addText(data.storeName + '\n');
  addBytes([0x1d, 0x21, 0x00]); // Normal size
  addBytes([0x1b, 0x45, 0x00]); // Bold Off
  addText(data.agentAddress + '\n');
  if (data.phone) {
    addText(`Telp/WA: ${data.phone}\n`);
  }

  // 4. Double Divider
  addText(doubleDivider);

  // 5. Transaction Details (Left aligned)
  addBytes([0x1b, 0x61, 0x00]); // Align Left
  addText(formatTwoCol('ID TRX:', data.trxId));
  addText(formatTwoCol('TANGGAL:', data.dateStr));
  addText(formatTwoCol('PLATFORM:', data.platform));
  addText(formatTwoCol('JENIS:', data.jenis));
  addText(formatTwoCol('PELANGGAN:', data.pelanggan));

  // 6. Dashed Divider
  addText(divider);

  // 7. Amounts
  addText(formatTwoCol('Nominal:', `Rp ${data.nominal.toLocaleString('id-ID')}`));
  addText(formatTwoCol('Biaya Admin:', `Rp ${data.biayaAdmin.toLocaleString('id-ID')}`));

  // 8. Dashed Divider
  addText(divider);

  // 9. Total Bayar (Bold, Double height)
  addBytes([0x1b, 0x45, 0x01]); // Bold On
  addText(formatTwoCol('TOTAL BAYAR:', `Rp ${data.totalBayar.toLocaleString('id-ID')}`));
  addBytes([0x1b, 0x45, 0x00]); // Bold Off

  // 10. Status
  addText(formatTwoCol('STATUS:', `[ ${data.status.toUpperCase()} ]`));

  // 11. Footer Note (Center aligned)
  addText(doubleDivider);
  addBytes([0x1b, 0x61, 0x01]); // Align Center
  addText(data.note + '\n');
  addText('Terima Kasih Atas Kunjungan Anda\n');

  // 12. Feed and Cut (Feed 4 lines, Partial Cut)
  addBytes([0x1b, 0x64, 0x04]);
  addBytes([0x1d, 0x56, 0x01]);

  // Merge chunks into single Uint8Array
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Print directly using RawBT Print Service via Android Intent Scheme & rawbt: protocol.
 * RawBT handles all Bluetooth Classic (SPP), BLE, USB, and WiFi thermal printers seamlessly.
 */
export async function printViaRawBT(
  data: ReceiptData,
  is80mm = false
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate binary ESC/POS buffer
    const escposBuffer = await generateEscPosBuffer(data, is80mm);
    
    // Convert buffer to binary string -> base64
    let binaryStr = '';
    for (let i = 0; i < escposBuffer.length; i++) {
      binaryStr += String.fromCharCode(escposBuffer[i]);
    }
    const base64Data = btoa(binaryStr);

    // Direct scheme registered by RawBT App
    const directRawbtUrl = `rawbt:base64,${base64Data}`;

    // Standard Android Intent without strict package lock that causes Play Store fallback when intent filter matches mime
    // Or direct window.location / anchor trigger
    const link = document.createElement('a');
    link.href = directRawbtUrl;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 500);

    return {
      success: true,
      message: 'Perintah cetak dikirim ke aplikasi RawBT.'
    };
  } catch (err: any) {
    console.error('RawBT print error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke RawBT: ${err.message || 'Terjadi kesalahan'}`
    };
  }
}

/**
 * Web Bluetooth Thermal Printer Connection & Print (Direct BLE)
 */
export async function printViaWebBluetooth(
  data: ReceiptData,
  is80mm = false,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Browser Anda belum mendukung Web Bluetooth. Gunakan tombol Cetak Langsung via RawBT.'
    };
  }

  try {
    onStatusUpdate?.('Mencari printer Bluetooth...');
    
    // Request Bluetooth device with typical POS/Thermal SPP services
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { namePrefix: 'MPT' },
        { namePrefix: 'RPP' },
        { namePrefix: 'POS' },
        { namePrefix: 'InnerPrinter' },
        { namePrefix: 'Bluetooth' },
        { namePrefix: 'Printer' },
        { namePrefix: 'Panda' },
        { namePrefix: 'Iware' },
        { namePrefix: 'Zywell' },
        { namePrefix: 'Thermal' },
        { namePrefix: 'PT-' },
        { namePrefix: 'MTP' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a01-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000e0ff-0000-1000-8000-00805f9b34fb',
        0x18f0,
        0xff00,
        0xae00
      ],
      acceptAllDevices: false
    }).catch(async () => {
      // Fallback: accept all bluetooth devices if filter didn't match specific prefix
      return await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a01-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000ae00-0000-1000-8000-00805f9b34fb',
          '0000e0ff-0000-1000-8000-00805f9b34fb',
          0x18f0,
          0xff00,
          0xae00
        ]
      });
    });

    if (!device) {
      return { success: false, message: 'Pencarian printer Bluetooth dibatalkan.' };
    }

    onStatusUpdate?.(`Menghubungkan ke ${device.name || 'Printer Thermal'}...`);
    const server = await device.gatt.connect();

    // Find GATT primary service
    const services = await server.getPrimaryServices();
    if (!services || services.length === 0) {
      throw new Error('Tidak dapat menemukan layanan cetak pada perangkat ini.');
    }

    let writeCharacteristic: any = null;

    // Scan for characteristic with write property
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeCharacteristic = char;
          break;
        }
      }
      if (writeCharacteristic) break;
    }

    if (!writeCharacteristic) {
      throw new Error('Karakteristik write printer Bluetooth tidak ditemukan.');
    }

    onStatusUpdate?.('Mengirim data struk ke printer...');
    const buffer = await generateEscPosBuffer(data, is80mm);

    // Send in chunks of 100 bytes (standard BLE MTU limit safety)
    const chunkSize = 100;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      if (writeCharacteristic.writeValueWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
      // brief delay between chunks
      await new Promise((r) => setTimeout(r, 25));
    }

    onStatusUpdate?.('Cetak struk berhasil!');
    setTimeout(() => {
      try {
        device.gatt.disconnect();
      } catch {}
    }, 1500);

    return {
      success: true,
      message: `Struk berhasil dicetak ke printer ${device.name || 'Bluetooth'}!`
    };
  } catch (err: any) {
    console.error('Bluetooth print error:', err);
    return {
      success: false,
      message: `Gagal mencetak via Bluetooth: ${err.message || 'Terjadi kesalahan koneksi'}`
    };
  }
}
