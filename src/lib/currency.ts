export const formatKES = (amount: number): string => {
  return `KES ${amount.toFixed(2)}`;
};

export const formatKESShort = (amount: number): string => {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
