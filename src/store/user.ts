import { eventBus } from '@/lib/event';
import { api } from '@/lib/trpc';
import { makeAutoObservable } from 'mobx';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseStore } from './baseStore';
import { BlinkoStore } from './blinkoStore';
import { RootStore } from './root';
import { Store } from './standard/base';
import { PromiseState } from './standard/PromiseState';

export class UserStore implements User, Store {
  sid = 'user';
  constructor() {
    makeAutoObservable(this)
  }
  id: string = '';
  name?: string = '';
  nickname?: string = '';
  image?: string = '';
  role: string = '';
  theme: any = 'light';
  isSetup: boolean = false;
  languageInitialized: boolean = false;
  themeInitialized: boolean = false;
  isHubInitialized: boolean = false;
  isUseAIInitialized: boolean = false;

  wait() {
    return new Promise<UserStore>((res, rej) => {
      if (this.id) {
        res(this);
      }

      //@ts-ignore
      this.event.once('user:ready', (user) => {
        res(this);
      });
    });
  }

  get isSuperAdmin() {
    return this.role === 'superadmin'
  }

  static wait() {
    return RootStore.Get(UserStore).wait();
  }

  get isLogin() {
    return !!this.name;
  }

  get blinko() {
    return RootStore.Get(BlinkoStore)
  }

  userInfo = new PromiseState({
    function: async (id: number) => {
      return await api.users.detail.query({ id })
    }
  })

  canRegister = new PromiseState({
    function: async () => {
      return await api.users.canRegister.mutate()
    }
  })

  setData(args: Partial<UserStore>) {
    Object.assign(this, args);
  }

  ready(args: Partial<UserStore>) {
    this.setData(args);
  }

  clear() {
    this.id = ''
    this.name = ''
    this.nickname = ''
    this.image = ''
    this.role = ''
    this.isSetup = false
  }

  updatePWAColor(theme: string) {
    const themeColor = theme === 'dark' ? '#1C1C1E' : '#F8F8F8';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', themeColor);
  }

  async initializeSettings(setTheme: (theme: string) => void, i18n: any) {
    const base = RootStore.Get(BaseStore);
    const config = await this.blinko.config.call();

    const handleFeatureRoute = (
      featureKey: 'hub' | 'ai',
      storageKey: string,
      routeConfig: {
        title: string;
        href: string;
        icon: string;
      } & any,
      stateFlag: 'isHubInitialized' | 'isUseAIInitialized'
    ) => {
      const savedValue = localStorage.getItem(storageKey);
      const configKey = featureKey === 'ai' ? 'isUseAI' : `isUseBlinkoHub`;
      const configValue = config?.[configKey];
      const currentValue = configValue ?? (savedValue === 'true');

      if (configValue !== undefined && savedValue !== String(configValue)) {
        localStorage.setItem(storageKey, String(configValue));
      }

      const routeIndex = base.routerList.findIndex(route => route.href === routeConfig.href);

      if (currentValue) {
        if (!this[stateFlag]) {
          if (routeIndex === -1) {
            base.routerList.splice(2, 0, routeConfig);
          }
          this[stateFlag] = true;
        }
      } else {
        if (this[stateFlag]) {
          if (routeIndex !== -1) {
            base.routerList.splice(routeIndex, 1);
          }
          this[stateFlag] = false;
        }
      }
    };

    handleFeatureRoute('ai', 'useAI', {
      title: "AI",
      href: '/ai',
      icon: 'mingcute:ai-line'
    }, 'isUseAIInitialized');

    handleFeatureRoute('hub', 'hubEnabled', {
      title: "hub",
      href: '/hub',
      icon: 'fluent:people-community-16-regular'
    }, 'isHubInitialized');

    const savedLanguage = localStorage.getItem('userLanguage');
    const savedTheme = localStorage.getItem('userTheme');

    if (savedLanguage && !this.languageInitialized) {
      RootStore.Get(BaseStore).changeLanugage(i18n, savedLanguage);
      this.languageInitialized = true;
    }

    if (savedTheme && !this.themeInitialized) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const themeToSet = savedTheme === 'system' ? systemTheme : savedTheme;
      setTheme(themeToSet);
      this.updatePWAColor(themeToSet);
      this.themeInitialized = true;
    }

    const darkElement = document.querySelector('.dark')
    const lightElement = document.querySelector('.light')

    if (config?.themeColor && config?.themeForegroundColor) {
      if (darkElement) {
        //@ts-ignore
        darkElement.style.setProperty('--primary', config.themeColor)
        //@ts-ignore
        darkElement.style.setProperty('--primary-foreground', config.themeForegroundColor)
      }
      if (lightElement) {
        //@ts-ignore
        lightElement.style.setProperty('--primary', config.themeColor)
        //@ts-ignore
        lightElement.style.setProperty('--primary-foreground', config.themeForegroundColor)
      }
    }

    if (this.isLogin) {
      try {
        if (config) {
          if (config.language && config.language !== savedLanguage) {
            localStorage.setItem('userLanguage', config.language);
            RootStore.Get(BaseStore).changeLanugage(i18n, config.language);
          }

          if (config.theme && config.theme !== savedTheme) {
            localStorage.setItem('userTheme', config.theme);
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const newTheme = config.theme === 'system' ? systemTheme : config.theme;
            setTheme(newTheme);
            this.updatePWAColor(newTheme);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user config:', error);
      }
    }
  }

  use() {
    const { data: session } = useSession();
    const { t, i18n } = useTranslation()
    const { setTheme, theme } = useTheme()
    const router = useRouter()

    useEffect(() => {
      this.initializeSettings(setTheme, i18n);
    }, []);

    useEffect(() => {
      const userStore = RootStore.Get(UserStore);
      if (!userStore.isLogin && session && session.user) {
        //@ts-ignore
        userStore.ready({ ...session.user });
        this.initializeSettings(setTheme, i18n);
        userStore.userInfo.call(Number(this.id))
        userStore.canRegister.call()
      }
    }, [session]);

    useEffect(() => {
      eventBus.on('user:signout', () => {
        if (router.pathname == '/signup' || router.pathname == '/api-doc' || router.pathname.includes('/share')) {
          return
        }
        localStorage.removeItem('username')
        localStorage.removeItem('password')
        RootStore.Get(UserStore).clear()
        router.push('/signin')
      })
    }, []);
  }
}
