import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

function PdfViewer({ file }) { // UPDATED: This now accepts a 'file' object again
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error) {
    setError('Failed to load PDF file. The file might be corrupted or in an unsupported format.');
    console.error('PDF Load Error:', error);
  }

  if (!file) {
    return <p style={{textAlign: 'center', color: '#999', marginTop: '50px'}}>Please select a PDF to begin.</p>;
  }

  if (error) {
    return <p style={{textAlign: 'center', color: '#ff6b6b', marginTop: '50px'}}>{error}</p>;
  }

  return (
    <div>
      <Document 
        file={file} // UPDATED: Use the file object directly
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<p style={{textAlign: 'center', color: '#999', marginTop: '50px'}}>Loading PDF...</p>}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page 
            key={`page_${index + 1}`} 
            pageNumber={index + 1} 
            renderTextLayer={true} 
            renderAnnotationLayer={true} 
          />
        ))}
      </Document>
    </div>
  );
}

export default PdfViewer;