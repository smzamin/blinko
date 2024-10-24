import '../styles/globals.css';
import '../styles/nprogress.css';
import '../styles/editor.css';
import '../styles/github-markdown.css';
import "swagger-ui-react/swagger-ui.css";
import 'react-photo-view/dist/react-photo-view.css';
import "@/server/share/index"
import '@/lib/i18n'
import NProgress from 'nprogress';
import React from 'react';
import TagSelectPop from '@/components/Common/TagSelectPop';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from '@nextui-org/react';
import { useEffect } from 'react';
import { Router } from 'next/router';
import { initStore } from '@/store/init';
import { Inspector, InspectParams } from 'react-dev-inspector';
import { CommonLayout } from '@/components/Layout';
import { AppProvider } from '@/store/module/AppProvider';

const MyApp = ({ Component, pageProps }) => {
  initStore();
  useProgressBar();
  return (
    <>
      <Inspector
        keys={['control', 'shift', 'c']}
        disableLaunchEditor={true}
        onClickElement={({ codeInfo }: InspectParams) => {
          if (!codeInfo?.absolutePath) return
          const { absolutePath, lineNumber, columnNumber } = codeInfo
          window.open(`vscode://file/${absolutePath}:${lineNumber}:${columnNumber}`)
        }}
      />
      <SessionProvider session={pageProps.session}>
        <AppProvider />
        <NextUIProvider>
          <ThemeProvider attribute="class" enableSystem={false} >
            <TagSelectPop />
            <CommonLayout>
              <Component {...pageProps} />
            </CommonLayout>
          </ThemeProvider>
        </NextUIProvider>
      </SessionProvider>
    </>
  );
};

export default MyApp;

const useProgressBar = () => {
  let timer: NodeJS.Timeout | null = null;
  const stopDelayMs = 200;

  const routeChangeStart = () => {
    NProgress.start();
  };

  const routeChangeEnd = () => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      NProgress.done(true);
    }, stopDelayMs);
  };

  useEffect(() => {
    Router.events.on('routeChangeStart', routeChangeStart);
    Router.events.on('routeChangeComplete', routeChangeEnd);
    Router.events.on('routeChangeError', routeChangeEnd);

    return () => {
      Router.events.off('routeChangeStart', routeChangeStart);
      Router.events.off('routeChangeComplete', routeChangeEnd);
      Router.events.off('routeChangeError', routeChangeEnd);
    };
  }, []);
};
