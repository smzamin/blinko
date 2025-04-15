import { BlinkoMultiSelectPop } from '@/components/BlinkoMultiSelectPop';
import { BlinkoMusicPlayer } from '@/components/BlinkoMusicPlayer';
import { LoadingPage } from '@/components/Common/LoadingPage';
import { CommonLayout } from '@/components/Layout';
import '@/lib/i18n';
import { RootStore } from '@/store';
import { initStore } from '@/store/init';
import { AppProvider } from '@/store/module/AppProvider';
import { PluginManagerStore } from '@/store/plugin/pluginManagerStore';
import { HeroUIProvider } from '@heroui/react';
import { motion } from 'motion/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Router } from 'next/router';
import NProgress from 'nprogress';
import { useEffect, useState } from 'react';
import { Inspector, InspectParams } from 'react-dev-inspector';
import 'react-photo-view/dist/react-photo-view.css';
import "swagger-ui-react/swagger-ui.css";
import '../styles/github-markdown.css';
import '../styles/globals.css';
import '../styles/nprogress.css';

const MyApp = ({ Component, pageProps }) => {
  const [isLoading, setIsLoading] = useState(true);
  initStore();
  useProgressBar();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    RootStore.Get(PluginManagerStore).initInstalledPlugins();
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <Inspector
        keys={['control','alt', 'x']}
        onClickElement={({ codeInfo }: InspectParams) => {
          if (!codeInfo?.absolutePath) return
          const { absolutePath, lineNumber, columnNumber } = codeInfo
          window.open(`cursor://file/${absolutePath}:${lineNumber}:${columnNumber}`)
        }}
      />
      <SessionProvider session={pageProps.session}>
        <HeroUIProvider>
          <ThemeProvider attribute="class" enableSystem={false} >
            <AppProvider />
            <CommonLayout>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Component {...pageProps} />
                <BlinkoMultiSelectPop />
              </motion.div>
            </CommonLayout>
          </ThemeProvider>
        </HeroUIProvider>
      </SessionProvider>
      <BlinkoMusicPlayer />
    </>
  );
};

export default MyApp;

const useProgressBar = () => {
  const routeChangeStart = (url: string, { shallow }) => {
    if (shallow) return;
    NProgress.start();
  };

  const routeChangeEnd = (url: string, { shallow }) => {
    if (shallow) return;
    NProgress.done(true);
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
