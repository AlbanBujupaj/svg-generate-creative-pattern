import SVGGenerator from "./components/SVGGenerator";

import { Analytics } from "@vercel/analytics/next";

function App() {
  return (
    <>
      <Analytics />
      <SVGGenerator />
    </>
  );
}

export default App;
