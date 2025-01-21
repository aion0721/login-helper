import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Config from "./components/pages/Config";

const App = () => {
  const location = useLocation(); // 現在のルート情報を取得

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {" "}
        {/* アニメーションが重ならないようにする */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

export default App;
