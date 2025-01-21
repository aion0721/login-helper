import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Config from "./components/pages/Config";
import { AppProvider } from "./context/AppContext";
import Server from "./components/pages/Server";

const App = () => {
  const location = useLocation(); // 現在のルート情報を取得

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {/* アニメーションが重ならないようにする */}
        <AppProvider>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/config" element={<Config />} />
            <Route path="/server" element={<Server />} />
          </Routes>
        </AppProvider>
      </AnimatePresence>
    </Layout>
  );
};

export default App;
