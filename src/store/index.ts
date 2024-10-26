import { RootStore } from "./root";
export const rootStore = RootStore.init();
export const useStore = () => RootStore.init();
export { RootStore };