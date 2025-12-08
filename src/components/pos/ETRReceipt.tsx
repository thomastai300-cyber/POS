import { forwardRef } from 'react';
import type { Sale } from '@/types';

interface ETRReceiptProps {
  sale: Sale;
  receiptNumber: string;
}

export const ETRReceipt = forwardRef<HTMLDivElement, ETRReceiptProps>(
  ({ sale, receiptNumber }, ref) => {
    const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;
    const saleDate = new Date(sale.timestamp);
    
    // Generate ETR specific data
    const cuInvoiceNumber = `CU${Date.now().toString().slice(-10)}`;
    const controlCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 font-mono text-xs max-w-[300px] mx-auto"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h2 className="text-lg font-bold">RINGO RETAIL SHOP</h2>
          <p className="text-[10px]">P.O. Box 12345-00100</p>
          <p className="text-[10px]">Nairobi, Kenya</p>
          <p className="text-[10px]">Tel: +254 700 000 000</p>
          <p className="text-[10px] mt-1">PIN: P0123456789A</p>
        </div>

        {/* ETR Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-center">
          <p className="font-bold">*** ETR RECEIPT ***</p>
          <p className="text-[10px]">ELECTRONIC TAX REGISTER</p>
        </div>

        {/* Receipt Details */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Receipt No:</span>
            <span>{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{saleDate.toLocaleDateString('en-KE')}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{saleDate.toLocaleTimeString('en-KE')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>ADMIN</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="font-bold mb-2">ITEMS</div>
          <div className="text-[10px] mb-1 flex justify-between font-bold">
            <span className="w-24">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Price</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {sale.items.map((item, index) => (
            <div key={index} className="text-[10px] flex justify-between py-0.5">
              <span className="w-24 truncate">{item.name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">{item.price.toFixed(2)}</span>
              <span className="w-16 text-right">{item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL (Inc. VAT):</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span>VAT (16%):</span>
            <span>{formatCurrency(sale.total * 0.16 / 1.16)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatCurrency(sale.amountPaid)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Change:</span>
            <span>{formatCurrency(sale.balance)}</span>
          </div>
        </div>

        {/* ETR Control Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-center text-[10px]">
          <p>CU Invoice No: {cuInvoiceNumber}</p>
          <p>Control Code: {controlCode}</p>
          <p className="mt-1">*** KRA APPROVED ***</p>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px]">
          <p>Thank you for shopping with us!</p>
          <p>Goods once sold cannot be returned</p>
          <p className="mt-2">Served by: ADMIN</p>
          <p className="mt-3 font-bold">** END OF RECEIPT **</p>
        </div>
      </div>
    );
  }
);

ETRReceipt.displayName = 'ETRReceipt';
