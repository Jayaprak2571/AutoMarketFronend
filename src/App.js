
import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './Pages/Home';
import Registration from './Pages/User/Registration';
import Login from './Pages/User/Login';
import UserCars from './Pages/User/Getusercars';
import AddCarForm from './Pages/User/Addcar';
import AllCars from './Pages/User/Allcars';
import TestDriveBookingForm from './Pages/User/Bookride'
import TestDriveUpdateForm from './Pages/User/Changestatus';
import MyCars from './Pages/User/Mycars';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/registration' element={<Registration />}></Route>
          <Route path="/testdrive/change-status/:vehicleId" element={<TestDriveUpdateForm />} />
          <Route path='/addcars/:sid' element={<AddCarForm />}></Route>
          <Route path='/usercars/:sid' element={<UserCars />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/allcars' element={<AllCars />}></Route>
          <Route path='/mycars/:sellerId' element={<MyCars />}></Route>
          <Route path='/bookride/:vehicleId/:sellerId' element={<TestDriveBookingForm />}></Route>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
