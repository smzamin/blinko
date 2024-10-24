import { observer } from "mobx-react-lite";
import Home from ".";

const Page = observer(() => {
  return <Home type={1}/>
});

export default Page