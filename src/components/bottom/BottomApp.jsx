import './ButtomApp.css'
const BottomApp=()=>{
    return (     
     <footer className="mainDivBottom">
        <p className="nameProjectBottom">
          ChillRate © {new Date().getFullYear()}
        </p>
        <p className="textAboutProject">
          Сервис для командного роста и внутренней гармонии
        </p>
        <p>
          <a href="#" className="linkAboutBottom">Поддержка</a>
        </p>
      </footer>)
}
export default BottomApp;