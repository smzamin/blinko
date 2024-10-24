import { type Tag } from '@/server/types';
import { _ } from './lodash';

const valMap = {
  undefined: '',
  null: '',
  false: false,
};
export interface TagTreeNode {
  name: string;
  children?: TagTreeNode[];
}
export type TagTreeDBNode = Tag & { children?: TagTreeDBNode[]; metadata: { icon: string, path: string } }
export const helper = {
  regex: {
    isEndsWithHashTag: /#[\w\u4e00-\u9fa5]*$/,
    isContainHashTag: /#[^\s#]*(?<![*?.。])/g
  },
  assemblyPageResult<T>(args: { data: T[], page: number, size: number, result: T[] }): { result: T[], isLoadAll: boolean, isEmpty: boolean } {
    const { data, page, size } = args
    let result = args.result
    let isLoadAll = false
    console.log(data)
    if (data.length == size) {
      if (page == 1) {
        result = data
      } else {
        result = result.concat(data)
        console.log('contact result', result)
      }
    } else {
      if (page == 1) {
        result = data
      } else {
        result = result.concat(data)
        isLoadAll = true
      }
    }
    console.log(result)
    return { result, isLoadAll, isEmpty: data.length == 0 }
  },
  extractHashtags(input: string): string[] {
    const hashtagRegex = /#[^\s#]*(?<![*?.。])/g;
    const matches = input.match(hashtagRegex);
    return matches ? matches : [];
  },
  buildHashTagTreeFromHashString(paths: string[]): TagTreeNode[] {
    const root: TagTreeNode[] = [];
    function insertIntoTree(pathArray: string[], nodes: TagTreeNode[]): void {
      if (pathArray.length === 0) return;
      const currentName = pathArray[0];
      let node = nodes.find(n => n.name === currentName);
      if (!node) {
        node = { name: currentName! };
        nodes.push(node);
      }
      if (pathArray.length > 1) {
        if (!node.children) {
          node.children = [];
        }
        insertIntoTree(pathArray.slice(1), node.children);
      }
    }
    for (const path of paths) {
      const pathArray = path.replace(/#/g, '').split('/');
      insertIntoTree(pathArray, root);
    }
    return root;
  },
  buildHashTagTreeFromDb(tags: Tag[]) {
    const map: Record<number, TagTreeDBNode> = {};
    const roots: TagTreeDBNode[] = [];
    tags.forEach(tag => {
      map[tag.id] = { ...tag, children: [], metadata: { icon: tag.icon, path: '' } };
    });
    function buildPath(tagId: number): string {
      const tag = map[tagId];
      if (!tag) return '';
      if (tag.parent && tag.parent !== 0) {
        const parentPath = buildPath(tag.parent);
        return parentPath ? `${parentPath}/${tag.name}` : tag.name;
      }
      return tag.name;
    }
    tags.forEach(tag => {
      const currentNode = map[tag.id];
      currentNode!.metadata.path = buildPath(tag.id);
      if (tag.parent === 0) {
        roots.push(currentNode!);
      } else {
        if (map[tag.parent]) {
          map[tag.parent]?.children?.push(currentNode!);
        }
      }
    });
    return roots;
  },
  generateTagPaths(node: TagTreeDBNode, parentPath: string = ''): string[] {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const paths: string[] = [`${currentPath}`];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        paths.push(...helper.generateTagPaths(child, currentPath));
      }
    }
    return paths;
  },
  getFileExtension(filename: string): string | null {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts.pop() || null;
    }
    return null
  },
  isImage(filename: string) {
    const extension = helper.getFileExtension(filename) ?? '';
    return 'JPEG/JPG/PNG/BMP/TIFF/TIF/WEBP/SVG'.includes(extension?.toUpperCase() ?? null)
  },
  promise: {
    async sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async runAsync<T, U = Error>(promise: Promise<T>): Promise<[U | null, T | null]> {
      return promise.then<[null, T]>((data: T) => [null, data]).catch<[U, null]>((err) => [err, null]);
    },
  },
  object: {
    crawlObject(object, options) {
      const newObj = JSON.parse(JSON.stringify(object));
      return helper.object.crawl(newObj, options);
    },
    crawl(object, options) {
      Object.keys(object).forEach((i) => {
        if (typeof object[i] === 'object') {
          helper.object.crawl(object[i], options);
        } else {
          const handler = options[typeof object[i]];
          if (handler) {
            object[i] = handler(object[i]);
          }
        }
      });
      return object;
    },
  },
  json: {
    isJsonString(str: string) {
      if (!str || typeof str !== 'string') return false;
      if (!str?.includes('{')) return false;
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },
    safeParse(val: any) {
      try {
        return JSON.parse(val);
      } catch (error) {
        return val;
      }
    },
  },
  deepAssign(target, ...sources) {
    sources.forEach((source) => {
      Object.keys(source).forEach((key) => {
        let descriptor = Object.getOwnPropertyDescriptor(source, key);
        if (descriptor && descriptor?.get) {
          return Object.defineProperty(target, key, descriptor);
        }
        const targetValue = target[key];
        let sourceValue = source[key];
        if (helper.isObject(targetValue) && helper.isObject(sourceValue)) {
          try {
            target[key] = helper.deepAssign(targetValue, sourceValue);
          } catch (e) {
            target[key] = Object.assign(targetValue, sourceValue);
          }
        } else {
          target[key] = sourceValue;
        }
      });
    });
    return target;
  },
  isObject(value) {
    return value != null && typeof value === 'object';
  },
  download: {
    downloadByBlob(name: string, blob: Blob) {
      const a = document.createElement('a');
      const href = window.URL.createObjectURL(blob);
      a.href = href;
      a.download = name;
      a.click();
    },
    downloadByLink(href: string) {
      const a = document.createElement('a');
      a.href = href;
      a.click();
    },
  },
  env: {
    //@ts-ignore
    isBrowser: typeof window === 'undefined' ? false : true,
  },
};
