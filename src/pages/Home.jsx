import React, { useState, useEffect } from 'react';
import { GetEstaciones } from "../api/getData"

import Header from '../components/Header'
import Footer from '../components/Footer'
import Main from  '../components/Main'



function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
       const estaciones = async () => {
         const response = await GetEstaciones();
         setData(response.data);
       }
   estaciones()
}, []);

  return (
    <>
        <Header/>
        <Main data = { data } type = "home" />
        <Footer/>
    </>
    
  )
}

export default Home