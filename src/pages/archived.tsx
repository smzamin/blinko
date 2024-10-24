import { observer } from "mobx-react-lite";
import Home from ".";

const Page = observer(() => {
  return <Home isArchived/>
});

export default Page