import React, { useState } from "react";
import Security from "../../service/Securite";
import "./HeaderApp.css"
import { Link } from "react-router-dom";
const HeaderApp=()=>{
    const [auth,setAuth]=useState(Security.getAuth());
    return  <header className="headerMainDiv">
        <div className="leftHeader">
          <h1 className="leftTextHeader">
            <Link to={'/'}>
              ChillRate
            </Link>
          </h1>
        </div>
        {auth==null?null:
        <div className="rightPartHeader">
          <div className="userDataHeader">
            <div>
              <div className="usernameHeader">{auth.name?auth.name:auth.email}</div>
              <div className="userStatusHeader">Тренер</div>
            </div>
          </div>
          <button
            onClick={() => console.log("Открыть настройки")}
            className="buttomSettingsHeader"
          >
            ⚙ Настройки
          </button>
          <button
            onClick={() => Security.logout()}
            className="buttonLogoutHeader"
          >
          Выйти
          </button>
        </div>
        }
      </header>

}
export default HeaderApp;