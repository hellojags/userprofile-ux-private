import { ThemeProvider } from "@material-ui/core";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Nav from "./components/Navbar/Nav";
import SnLoader from "./components/Utils/SnLoader";
import "./index.css";
import { setLoaderDisplay } from "./redux/action-reducers-epic/SnLoaderAction";
import { setUserSession } from "./redux/action-reducers-epic/SnUserSessionAction";
import SnRouter from "./router/SnRouter";
import { initMySky } from "./service/skynet-api";
import { skappTheme } from "./theme/Theme";
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setLoaderDisplay(true));
    initMySky().then(({ loggedIn, userSession }) => {
      if (loggedIn)
        // only if login is true set session
        dispatch(setUserSession(userSession));
    });
    dispatch(setLoaderDisplay(false));
  }, []);

  return (
    <Router>
      <ThemeProvider theme={skappTheme}>
        <SnLoader />
        <div className="App">
          <Nav />
          <section className="main-content">
            <main className="app-content" id="app-content">
              <SnRouter />
            </main>
          </section>
        </div>
      </ThemeProvider>
    </Router>
  );
}
export default App;
