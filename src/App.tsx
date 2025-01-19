import { Route, Routes } from "react-router";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Config from "./components/pages/Config";

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </Layout>
  );
};

export default App;
