import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import Hub from "../hub";

const Share = observer(() => {
  useEffect(() => {

  }, [])

  return <div className="flex flex-col h-[100vh] w-full bg-sencondbackground" >
    <Hub />
  </div>
});

export default Share