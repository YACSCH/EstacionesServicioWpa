import React, { useState, useEffect } from 'react';
import { GetDistribuidores } from "../api/getData"

import Header from '../components/Header'
import Footer from '../components/Footer'
import Main from  '../components/Main'

function Distribuidores() {
  const [distribuidores, setDistribuidores] = useState([]);

  useEffect(() => {
       const dataDistribuidores = async () => {
         const response = await GetDistribuidores();
         setDistribuidores(response.data);
       }
       dataDistribuidores()
}, []);

 return (
   <>
       <Header/>
       <Main data = { distribuidores }  type="distribuidores"/>
       <Footer/>
   </>
   
 )
}

export default Distribuidores