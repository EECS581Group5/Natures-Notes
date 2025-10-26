import logo from './nature_logo.png';
import './App.css';
import Weather from './Weather';

function App() {
  return (
    <div className="App">
      <div id="top-banner">
        <img src={logo}
         className="App-logo" alt="logo" />
        <p>
          Nature Notes is coming soon!
          
        </p>
        </div>
        <div class="clear"></div>
      
      <header className="App-header">
        
        <Weather />
        <br></br>
      </header>
    </div>
  );
}

export default App;
