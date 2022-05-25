import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import People from './Components/People.js';

function App() {
  return (
    <div className="App">
        <Routes>
          <Route element={<People />} path="/people" />

          <Route path="*" element={<Navigate replace to="/people" />} />


        </Routes>
    </div>
  );
}

export default App;
