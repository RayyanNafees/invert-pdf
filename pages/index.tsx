import React, { useCallback, useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Document, Page, pdfjs } from 'react-pdf';
import jsPDF from 'jspdf';

const doc = new jsPDF('l', 'px', 'a4');

const Progress = React.memo(function Progress(props: any) {
  return (
    <div>
      {props.isLoading === false &&
        `${props.status} ${
          props.status !== 'Inversion Complete!' && props.progress < 101
            ? `(${props.progress}%)`
            : ''
        }`}
    </div>
  );
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [imageUrlArray, setImageUrlArray] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState();
  const [heights, setHeights] = useState([]);
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState('');

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const handleImage = useCallback(
    (event: any) => {
      setStatus('Loading');
      setImageUrlArray([]);
      const file = event.target.files[0];

      setSteps(1 + steps);

      if (!!file?.type?.length && file.type === 'application/pdf') {
        setIsLoading(true);
        setSelectedPDFFile(file);
      } else if (!!file?.type?.length) {
        setFileType('image');
        setImageUrlArray([URL.createObjectURL(file).toString()]);
      }

      setSteps(1 + steps);
    },
    [
      setSelectedPDFFile,
      setImageUrlArray,
      imageUrlArray,
      setIsLoading,
      isLoading,
    ]
  );

  const onLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setStatus('Rendering');
      setNumPages(numPages);
      setIsLoading(false);

      setSteps(1 + steps);
    },
    [setNumPages, numPages, setIsLoading]
  );

  const onRenderSuccess = useCallback(
    (pageIndex) => {
      setStatus('Inverting');
      setSteps(1 + steps);

      Array.from(new Array(numPages), (el, index) => {
        const importPDFCanvas: HTMLCanvasElement = document.querySelector(
          `.import-pdf-page-${index + 1} canvas`
        );

        setSteps(1 + steps);

        importPDFCanvas.getContext('2d').filter = 'invert(1)';

        if (pageIndex === index) {
          importPDFCanvas.toBlob((blob) => {
            setImageUrlArray((prev: string) => [
              ...prev,
              URL.createObjectURL(blob),
            ]);
          });

          setSteps(1 + steps);

          setHeights((h) =>
            h.concat({
              height: importPDFCanvas.height,
              width: importPDFCanvas.width,
            })
          );
        }
      });
    },
    [numPages, setImageUrlArray, imageUrlArray, setHeights]
  );

  useMemo(() => {
    const f: number = 1.4;
    if (Array.isArray(imageUrlArray) && imageUrlArray?.length == numPages) {
      setStatus('Downloading');

      for (let i = 0; i < imageUrlArray.length; i++) {
        const dimnsn = heights[i];
        doc.addImage(
          imageUrlArray[i],
          'PNG',
          0,
          0,
          dimnsn.width / f,
          dimnsn.height / f
        );
        doc.addPage([dimnsn.width / f, dimnsn.height / f], 'l');

        setSteps((s) => 1 + s);
      }
      setStatus('Inversion Complete!');
      setSteps(numPages);

      setSteps(1 + steps);

      doc.deletePage(0);
      setSteps(1 + steps);

      doc.deletePage(numPages - 2);
      setSteps(1 + steps);

      doc.save('inverted.pdf');
      setSteps(1 + steps);

      setSteps(0);
      setStatus('');
      setIsLoading(null);
      // }, 1000);
      // alert([ count, numPages, count/numPages, steps]);
    }
  }, [imageUrlArray, numPages, selectedPDFFile, setIsLoading, setSteps]);

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF Invert</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>PDF client-side inversion</h1>
        <label htmlFor="upload" className={styles.download}>
          Upload PDF
        </label>
        <input
          style={{ display: 'none' }}
          id="upload"
          type="file"
          onChange={handleImage}
        />

        {isLoading && <div className={styles.loader} />}

        {selectedPDFFile && (
          <div className={styles.image}>
            <Document
              file={selectedPDFFile}
              onLoadSuccess={onLoadSuccess}
              error={<div>An error occurred!</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <>
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className={`import-pdf-page-${index + 1} ${styles.image} ${
                      fileType === 'image' && styles.none
                    }`}
                    onRenderSuccess={() => onRenderSuccess(index)}
                    width={1024}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    error={<div>An error occurred!</div>}
                  />
                  {imageUrlArray[index] && (
                    <a
                      className={styles.download}
                      href={imageUrlArray[index]}
                      download
                    >
                      download file
                    </a>
                  )}
                </>
              ))}
            </Document>
          </div>
        )}
        {steps ? (
          <Progress
            progress={parseInt(String((steps / (numPages - 4)) * 100))}
            isLoading={isLoading}
            status={status}
          />
        ) : null}
      </main>
    </div>
  );
}
