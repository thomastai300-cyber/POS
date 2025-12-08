import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { StockItem } from '@/types';
import { formatKES } from '@/lib/currency';

interface BarcodeLabelProps {
  item: StockItem;
  quantity?: number;
}

export function BarcodeLabel({ item, quantity = 1 }: BarcodeLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = labelRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels - ${item.name}</title>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .label-container {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
              padding: 2mm;
            }
            .label {
              width: 48mm;
              height: 28mm;
              border: 1px dashed #ccc;
              padding: 2mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-inside: avoid;
            }
            .product-name {
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2px;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-display {
              font-family: 'Libre Barcode 128', monospace;
              font-size: 36px;
              line-height: 1;
              letter-spacing: 0;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 9px;
              margin-top: 2px;
            }
            .price {
              font-size: 12px;
              font-weight: bold;
              margin-top: 2px;
            }
            @media print {
              .label {
                border: none;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="label-container">
            ${Array(quantity).fill(`
              <div class="label">
                <div class="product-name">${item.name}</div>
                <div class="barcode-display">*${item.barcode}*</div>
                <div class="barcode-text">${item.barcode}</div>
                <div class="price">${formatKES(item.price)}</div>
              </div>
            `).join('')}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Preview Label */}
      <div 
        ref={labelRef}
        className="border border-dashed border-border rounded-lg p-3 bg-background mb-3"
        style={{ width: '200px' }}
      >
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
          <div 
            className="my-1 text-3xl leading-none"
            style={{ fontFamily: "'Libre Barcode 128', monospace" }}
          >
            *{item.barcode}*
          </div>
          <p className="text-xs font-mono text-muted-foreground">{item.barcode}</p>
          <p className="text-sm font-bold text-foreground">{formatKES(item.price)}</p>
        </div>
      </div>
      
      <Button onClick={handlePrint} size="sm" variant="outline" className="w-full">
        <Printer className="w-4 h-4 mr-2" />
        Print {quantity > 1 ? `${quantity} Labels` : 'Label'}
      </Button>
    </div>
  );
}
