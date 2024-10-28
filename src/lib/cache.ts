
export class memoryCache {
  cache: Map<string, { value: any, expiration: number }> = new Map()
  constructor() {
    this.cache = new Map()
  }
  get(key: string) {
    return this.cache.get(key)
  }
  set(key: string, value: any) {
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }

  async wrap<T extends (...args: any[]) => Promise<any>, U = ReturnType<T>>(key: string, fn: T, args: { ttl: number, alowStale?: boolean }): Promise<Awaited<U>> {
    const data = this.get(key)
    if (data?.expiration && new Date(data.expiration) <= new Date()) {
      if (args?.alowStale) {
        fn().then((value) => {
          this.set(key, {
            value,
            expiration: new Date().setTime(new Date().getTime() + args.ttl || 60 * 1000)
          })
        }).catch(err => {
          console.error(err)
        })
      } else {
        //@ts-ignore
        // data = null;
        this.set(key, {
          value: null,
        })
      }
    }
    if (!data || !data.value) {
      const value = await fn();
      this.set(key, {
        value,
        expiration: new Date().setTime(new Date().getTime() + args.ttl || 60 * 1000)
      })
      return value;
    }
    return data.value
  }

}
export const cache = new memoryCache()