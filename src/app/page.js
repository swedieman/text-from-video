'use client'
import { useEffect, useState, useRef } from 'react';
import styles from "./page.module.css";

export default function Home() {
  const [textFiles, setTextFiles] = useState([]);
  // const [hasText, setHasText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef();

  useEffect(() => {
    (async () => {
      setTextFiles(await getTexts());
    })();
  }, []);

  // TODO: Perhaps we should add cache here so that we don't download the same text multiple times.
  const extractText = async () => {
    setLoading(true);
    // Send YouTube URL to backend which extract the subtitles.
    try {
      const res = await fetch('/api/fetchsubtitles', {
        method: 'POST',
        body: JSON.stringify({ url: urlRef.current.value }),
        headers: { 'Content-Type': 'application/json' },
      });
      const resObj = await res.json();
      if (resObj.error) {
        console.error(resObj.error);
        setError(resObj.error);
      } else {
        // Text extracted. Now we can get text files.
        setTextFiles(await getTexts());
      }

      setLoading(false);
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const getTexts = async () => {
    try {
      const res = await fetch('/api/texts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const resObj = await res.json();
      if (resObj.error) {
        console.error(resObj.error);
        setError(resObj.error);
        return [];
      }
      return resObj.files;
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const getTextFileData = async (filename) => {
    try {
      const res = await fetch('/api/downloadfile', {
        method: 'POST',
        body: JSON.stringify({ filename }),
        headers: { 'Content-Type': 'application/json' },
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const resObj = await res.json();
        if (resObj.error) {
          console.error(resObj.error);
          setError(resObj.error);
          return null;
        } else {
          setError('An uknown error happened when downloading text file.');
          return null;
        }
      }

      return await res.blob();
    } catch (e) {
      console.error(e);
      setError(e.message);
      return null;
    }
  };

  const downloadFile = async (filename) => {
    const data = await getTextFileData(filename);

    if (data !== null) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(data);
      link.download = filename;
      link.click();
    }
  };

  const cpTextFromFile = async (filename) => {
    const data = await getTextFileData(filename);
    navigator.clipboard.writeText(await data.text());
    alert('Text from file copied to clipboard');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>Get text from subtitles from a YouTube video</h2>
        <div className={styles.videoLinkContainer}>
          <input
            ref={urlRef}
            className={styles.videoLinkInput}
            placeholder="Put your YouTube video URL here"
          />
          <button onClick={extractText}>Extract text from video</button>
        </div>
        <div className={`${styles.info} ${error !== '' ? styles.error : ''}`}>
          {error ? error : (loading ? 'Extracting subtitles from video...' : '')}
        </div>
        <div className={styles.textFileGrid}>
          {textFiles.map((file, i) => (
            <div key={`file-${i}`}>
              <div>{file}</div>
              <div>
                <button onClick={() => downloadFile(file)}>Download file</button>
              </div>
              <div>
                <button onClick={() => cpTextFromFile(file)}>Copy text to clipboard</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  /*
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>To get started, edit the page.js file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className={styles.secondary}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
  */
};
