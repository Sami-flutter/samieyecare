import { useCallback } from 'react';

export function usePrint() {
  const printElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              display: flex;
              justify-content: center;
              padding: 20px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  return { printElement };
}
