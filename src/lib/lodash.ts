import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import difference from "lodash/difference";
import each from "lodash/each";
import flattenDeep from "lodash/flattenDeep";
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import isEqual from "lodash/isEqual";
import isNil from "lodash/isNil";
import keyBy from "lodash/keyBy";
import merge from "lodash/merge";
import mergeWith from "lodash/mergeWith";
import omitBy from "lodash/omitBy";
import orderBy from "lodash/orderBy";
import pick from "lodash/pick";
import remove from "lodash/remove";
import set from "lodash/set";
import throttle from "lodash/throttle";
import uniqBy from "lodash/uniqBy";
import uniqWith from "lodash/uniqWith";
export const _ = {
  throttle,
  debounce,
  each,
  flattenDeep,
  omitBy,
  isNil,
  keyBy,
  mergeWith,
  cloneDeep,
  groupBy,
  get,
  set,
  remove,
  merge,
  isEqual,
  uniqWith,
  orderBy,
  pick,
  difference,
  uniqBy
};
