import axios from "axios";

class Api{
    static url=`http://26.229.77.233:8099/api/v1`;
    static async getTest(token){
      return await axios.get(`${this.url}/test`,{headers: {Authorization: `Client ${token}`}})
      .then(response=>response.data)
      .catch(ex=>null);
    }
    static async register(name,email,password){
        return await axios.post(`${this.url}/auth/regAdmin`,{
            name:name,
            email:email,
            password:password})
        .then((response)=>{
            return response.data;
        })
        .catch((ex)=>{
          if(ex.response){
            return ex.response.data;
          }
          return ex
        })
    }
    static async auth(name,email,password){
        return await axios.post(`${this.url}/auth/authenticate`,{
            name:name,
            email:email,
            password:password
        }).then((response)=>{
            return response.data;
        })
        .catch(ex=>{
          if(ex.response.data){
            return ex.response.data
          }
          return ex
        });
    }

    // распределение
    static async getClientDist(uuid, token) {
      return await axios.get(`${this.url}/client/${uuid}`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async getTeams(token) {
      return await axios.get(`${this.url}/team`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async acceptUser(teamId, userEmail, token) {
      return await axios.post(`${this.url}/team/${teamId}/${userEmail}`, {}, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async removeUser(teamId, userId, token) {
      return await axios.delete(`${this.url}/team/${teamId}/${userId}`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async createTeam(name, token) {
      return await axios.post(`${this.url}/team`, { name: name }, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async editTeamName(name, token) {
      return await axios.put(`${this.url}/team`, { name: name }, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async deleteTeam(id, token) {
      return await axios.delete(`${this.url}/team/${id}`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async getTeamInfo(id, token) {
      return await axios.get(`${this.url}/team/${id}`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async getAdminUrl(token) {
      return await axios.get(`${this.url}/admin/url`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async getWaitUsers(token) {
      return await axios.get(`${this.url}/admin/waitUsers`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }

    static async getUserData(teamId, userEmail, token) {
      return await axios.get(`${this.url}/admin/${teamId}/${userEmail}`, {headers: {Authorization: `Client ${token}`}})
        .then((response) => {
          return response.data;
        })
        .catch((ex) => {
          return ex;
        });
    }
}
export default Api;