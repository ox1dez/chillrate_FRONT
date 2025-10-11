import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Await } from 'react-router-dom';
import CoachHomePage from './components/pages/main/mainPage';
import DashboardLayout from './components/pages/team/teamPage';
import UserDetailPage from './components/pages/UserDatail/UserDetailPage';
import AuthPage from './components/pages/auth/auth';
import WelcomePage from './components/pages/welcomePage/welcomePage';
import ConfirmEmailPage from './components/pages/confirmEmail/confirmEmailPage';
import Security from './service/Securite';
import Api from './service/Api';



function App() {
  const [auth,setAuth]=useState(Security.getAuth());
  Security.callBack=setAuth;
  useEffect(()=>{
    const load=async ()=>await Security.getAuthWithCheck();
    load();
  },[])
  
  return (
    <Router>
      <Routes>
        <Route path="/main" element={auth?<CoachHomePage />:<Navigate to="/auth"/>} />
        <Route path="/team/:teamId" element={auth?< DashboardLayout/>:<Navigate to="/auth"/>} />
        <Route path="/:teamId/:userId" element={auth? <UserDetailPage /> :<Navigate to="/auth"/>} />
        <Route path="/auth" element={auth?<Navigate to="/main"/>:<AuthPage/>} />
        <Route path="/" element={auth?<Navigate to="/main"/>:<WelcomePage/>} />
        <Route path="/confirm" element={auth?<Navigate to="/main"/>:<ConfirmEmailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
