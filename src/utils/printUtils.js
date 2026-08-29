import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export const generatePdfFromPages = async (pages) => {
  // Wait for all fonts to make sure styling isn't broken
  try { if (document.fonts?.ready) await document.fonts.ready; } catch {}

  const ROW_PX = 36; 
  const SIGN_ROW_PX_PDF = 80;

  // Merge CSS rules from ReportPreview and BulkApprovalPage for full compatibility
  const pdfOnlyCSS = `
    .report-content *, .page * {
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans KR", "Malgun Gothic", sans-serif !important;
      letter-spacing: 0 !important;
      word-spacing: 0 !important;
      -webkit-font-smoothing: grayscale !important; 
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: auto !important;
      text-shadow: none !important;
      box-shadow: none !important;
      transition: none !important;
      animation: none !important;
    }
    .report-content, .page { 
      width: 794px !important; 
      padding: 10px 40px 40px 40px !important; 
      background: white !important;
      box-sizing: border-box !important;
      border: none !important;
    }
    .report-content .mt-4 { margin-top: 4px !important; }
    .report-content .mb-6 { margin-bottom: 12px !important; }
    .report-content .mb-4 { margin-bottom: 8px !important; }
    .report-content .my-4 { margin-top: 8px !important; margin-bottom: 8px !important; }
    .report-content .mt-10 { margin-top: 20px !important; }
    .report-content .leading-loose { line-height: 1.5 !important; }
    .report-content table, table { 
      table-layout: fixed !important; 
      border-collapse: collapse !important; 
    }
    .report-content table, table,
    .report-content table th, table th,
    .report-content table td, table td {
      border-color: #6b7280 !important; 
    }
    .report-content table:not(.approval-table), table:not(.approval-table) { 
      width: 100% !important; 
    }
    .approval-container, .approval-wrapper {
      display: block !important;
      width: 100% !important;
      margin-bottom: 20px !important;
      overflow: hidden !important;
    }
    .approval-table-left { 
      float: left !important; 
      width: calc(var(--left-col-count, 4) * 11%) !important; 
      min-width: calc(var(--left-col-count, 4) * 11%) !important;
    }
    .approval-table-right { 
      float: right !important; 
      width: 40% !important; 
    }
    .report-content table.approval-table tbody tr.sign-row th,
    .report-content table.approval-table tbody tr.sign-row td,
    table.approval-table tbody tr.sign-row th,
    table.approval-table tbody tr.sign-row td,
    .sign-row td {
      height: ${SIGN_ROW_PX_PDF}px !important;
    }
    .report-content table th, .report-content table td,
    table th, table td {
      height: ${ROW_PX}px !important;
      box-sizing: border-box !important;
      vertical-align: middle !important;
      text-align: center !important;
      padding: 0 5px !important;
    }
    .report-content table.expense-table td.expense-col-detail, .detail-col {
      text-align: left !important;
      padding-left: 12px !important;
    }
    .report-content table.expense-table td.text-right, .amount-col {
      text-align: right !important;
      padding-right: 12px !important;
    }
    .report-content table td.expense-remarks {
      text-align: left !important;
      padding-left: 12px !important;
    }
    .report-content .no-print, .no-print { display: none !important; }
  `;

  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      onclone: (doc) => {
        doc.documentElement.style.width = '1200px';
        doc.body.style.width = '1200px';
        doc.body.style.margin = '0';
        doc.body.style.padding = '0';

        const styleNode = doc.createElement("style");
        styleNode.textContent = pdfOnlyCSS;
        doc.head.appendChild(styleNode);

        // Find the matching cloned page in the cloned document
        let clonedPage = null;
        const allClonedPages = doc.querySelectorAll('.page');
        if (allClonedPages.length > i) {
          clonedPage = allClonedPages[i];
        }

        if (clonedPage) {
          const leftTable = clonedPage.querySelector('.approval-table-left');
          const rightTable = clonedPage.querySelector('.approval-table-right');
          if (leftTable && rightTable) {
             let wrapper = clonedPage.querySelector('.approval-container') || clonedPage.querySelector('.approval-wrapper');
             if (!wrapper) {
                 wrapper = doc.createElement('div');
                 wrapper.className = 'approval-container';
                 leftTable.parentNode.insertBefore(wrapper, leftTable);
                 wrapper.appendChild(leftTable);
                 wrapper.appendChild(rightTable);
             }
             const clear = doc.createElement('div');
             clear.style.clear = 'both';
             wrapper.appendChild(clear);
          }

          let curr = clonedPage;
          while (curr && curr !== doc.body) {
            curr.style.transform = 'none';
            curr.style.position = 'static';
            curr.style.margin = '0';
            curr.style.padding = '0';
            curr = curr.parentElement;
          }

          clonedPage.style.display = 'block';
          clonedPage.style.width = '794px';
          clonedPage.style.margin = '0 auto';
          clonedPage.style.boxShadow = 'none';
          
          Array.from(doc.body.children).forEach(child => {
            if (!child.contains(clonedPage)) child.remove();
          });
        }
      },
    });

    const img = canvas.toDataURL("image/jpeg", 0.98);
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const printW = pdfW - (margin * 2);
    const printH = pdfH - (margin * 2);
    const imgH = (canvas.height * printW) / canvas.width;

    if (i > 0) pdf.addPage();
    
    let position = 0;
    let heightLeft = imgH;

    pdf.addImage(img, "JPEG", margin, margin + position, printW, imgH);
    heightLeft -= printH;

    while (heightLeft > 0) {
      position = position - printH;
      pdf.addPage();
      pdf.addImage(img, "JPEG", margin, margin + position, printW, imgH);
      heightLeft -= printH;
    }
  }
  return pdf;
};

export const printPdfBlob = (pdf) => {
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  let iframe = document.getElementById("pdfPrintFrame");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "pdfPrintFrame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }

  iframe.src = url;

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };
};

export const savePdf = (pdf, fileName) => {
  pdf.save(fileName);
};
