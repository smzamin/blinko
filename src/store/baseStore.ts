import dayjs from 'dayjs';
import { Store } from './standard/base';
import { StorageState } from './standard/StorageState';
import { makeAutoObservable } from 'mobx';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export class BaseStore implements Store {
  sid = 'BaseStore';
  constructor() {
    makeAutoObservable(this)
  }
  routerList = [
    {
      title: "blinko",
      href: '/',
      icon: 'basil:lightning-outline'
    },
    {
      title: "notes",
      href: '/notes',
      icon: 'hugeicons:note'
    },
    {
      title: "resources",
      href: '/resources',
      icon: 'solar:database-linear'
    },
    {
      title: "archived",
      href: '/archived',
      icon: 'solar:box-broken'
    },
    {
      title: "settings",
      href: '/settings',
      icon: 'lsicon:setting-outline'
    }
  ];
  currentRouter = this.routerList[0]
  currentTitle = ''

  locale = new StorageState({ key: 'language', default: 'en' });
  locales = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '简体中文' },
    { value: 'zh-tw', label: '繁體中文' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ko', label: '한국어' },
    { value: 'ja', label: '日本語' },
  ];

  changeLanugage(i18n, locale) {
    i18n.changeLanguage(locale)
    dayjs.locale(i18n.resolvedLanguage);
    this.locale.save(locale)
  }

  useInitApp(router) {
    const documentHeight = () => {
      const doc = document.documentElement
      doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
    }
    const { t, i18n } = useTranslation()
    useEffect(() => {
      this.changeLanugage(i18n, this.locale.value)
      documentHeight()
      window.addEventListener('resize', documentHeight)
    }, [router.isReady])

    useEffect(() => {
      if (router.pathname == '/review') {
        this.currentTitle = 'daily-review'
      } else if (router.pathname == '/detail') {
        this.currentTitle = 'detail'
      } else if (router.pathname == '/all') {
        this.currentTitle = t('total' )
      } else {
        this.currentTitle = this.currentRouter?.title ?? ''
      }
    }, [this.currentRouter, router.pathname])
  }
}
