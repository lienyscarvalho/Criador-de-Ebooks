import "../styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Nébula — crie e-books com IA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
