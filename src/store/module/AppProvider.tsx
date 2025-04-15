import { observer } from "mobx-react-lite";
import React from "react";
import { RootStore } from "../root";

export const AppProvider = observer(({ children }: { children?: React.ReactNode }) => {
  const rootStore = RootStore.init()
  return (
    <>
      {rootStore.providers.map((store) => {
        const Component: any = store.provider;
        return <Component rootStore={rootStore} key={store.sid} />;
      })}
      {children && children}
    </>
  )
})
