import { createRoot } from 'react-dom/client'
import React, { Component ,useEffect,useState} from 'react';
import axios from "axios";

// function Home() {

//   const[text,setText]=useState("");
//   const[car,setCar]=useState("");
//   const[inputs,setInputs]=useState({
//     firstname: 'John',
//     'lastname': 'Doe'
//   });

//   function getFullname(e){

//     const name = e.target.name;
//     const value =e.target.value;

//     setInputs(values =>({...values,[name]:value}));
//     //setInputs(values =>({...values,[name]:value})); as we are storing 2 values it has to display both at the same time
//     // if we use setInputs(values =>({[name]:value})); it will simply display firstname or lastname when we are we are entering
//   }


//   function getDropdown(e){
//     setCar(e.target.value);
//   }

//   function handleChange(e){ 
//     setText(e.target.value);
//   }

//   function handleSubmit(e){
//     e.preventDefault()
//     if ((text.length)>0){
//       alert(text)
//     }
    
//   }

//   const aa = [{
//     "id": 6,
//     "make": "Maruthi",
//     "model": "Swift",
//     "year": 2022,
//     "price": "750000.00",
//     "condition": "Used",
//     "description": "Good condition",
//     "seller_id": 3,
//     "created_at": "2025-11-18T10:36:01.239119Z",
//     "updated_at": "2025-11-18T10:36:01.239119Z"
// }]


//   return (
//     <div id='root'>
//     <form onSubmit={handleSubmit}>
//       <textarea value={text} onChange={handleChange}></textarea>
//       <p>Current Value {text}</p>
//       <input type='submit'></input>
//       <br></br>
//       <select  value={car} onChange={getDropdown}>
//         <option value='Cricket'>Cricket</option>
//         <option value='Volleyball'>Volleyball</option>
//         <option value='Kabbaddi'>Kabbaddi</option>
//       </select>
//       <p>You opted for this sport {car}</p>
//       <br></br><br></br><br></br><br></br>
//       <label>First Name</label><input name='firstname' type='text' onChange={getFullname} value={inputs.firstname}></input><label>Last Name</label><input onChange={getFullname} name='lastname' value={inputs.lastname} type='text'></input>
//       <p>You Full name: {inputs.firstname} {inputs.lastname} </p>
//     </form>
//     <br></br>
//     <br></br>
//     <br></br>
    
    // {aa.map(user =>(
    //   <div key={user.id}>
    //   <li>{user.make}</li>
    //   <li>{user.model}</li>
    //   <li>{user.id}</li>
//       </div>
      
//       //<p>{user.model}</p>      
//     ))}
    

//     </div>
//   )
// }

export default Home;



async function Home() {

  const token = localStorage.getItem("access_token"); // if you're using header-based auth


  const res = await axios.get(
    "http://127.0.0.1:8002/testdrive/getdrives/5",
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // remove if you're using HttpOnly cookies
      },
      withCredentials: true, // enable if you use cookie-based auth
    }
  );

  console.log("Created Car:", res.data);

  return (
    <div>
      <h2>My Data Loading</h2>
    </div>
  );
}
