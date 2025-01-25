import React, { Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import { AppProvider } from "./context/AppContext";

const Home = React.lazy(() => import("./components/pages/Home"));
const Config = React.lazy(() => import("./components/pages/Config"));
const Server = React.lazy(() => import("./components/pages/Server"));
const Data = React.lazy(() => import("./components/pages/Data"));

const App = () => {
  const location = useLocation(); // 現在のルート情報を取得

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {/* アニメーションが重ならないようにする */}
        <AppProvider>
          {/* Suspenseでローディング状態を管理 */}
          <Suspense fallback={<div>Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/config" element={<Config />} />
              <Route path="/server" element={<Server />} />
              <Route path="/data" element={<Data />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </AnimatePresence>
    </Layout>
  );
};

export default App;
