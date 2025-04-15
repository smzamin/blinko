import { enableStaticRendering } from 'mobx-react-lite';
import { useEffect } from 'react';
import { rootStore } from '.';
import { ToastPlugin } from './module/Toast/Toast';
enableStaticRendering(typeof window === 'undefined');

export const initStore = () => {
  useEffect(() => {
    rootStore.addStores([new ToastPlugin()]);
  }, []);
};
