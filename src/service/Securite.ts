import { useEffect } from "react";
import { json } from "stream/consumers";
import Api from "./Api";

class Security{

    private static tokenParamName='token';
    private static authParamName='user';
    static callBack=(data)=>{};
    static login(userData,token,isLogin){
        localStorage.setItem(this.tokenParamName, token);
        localStorage.setItem(this.authParamName,JSON.stringify(userData));
        if(isLogin){
            this.callBack(userData);
        }
    }
    static getToken(){
        return localStorage.getItem(this.tokenParamName);
    }
    static getAuth(){
        let userData=localStorage.getItem(this.authParamName);
        if(userData){
            userData=JSON.parse(userData);
        }
        return userData;
    }
    static async getAuthWithCheck(){
        var token=this.getToken();
        if(token==null){
            this.callBack(null);
            return;
        }
        if(await Api.getTest(token)){
            this.callBack( this.getAuth());
        }
        else{
            this.callBack(null);
        }
    }
    static logout(){
        localStorage.removeItem(this.tokenParamName);
        localStorage.removeItem(this.authParamName);
        this.callBack(null);
    }
}

export default Security;