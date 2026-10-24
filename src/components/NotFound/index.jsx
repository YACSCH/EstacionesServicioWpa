import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFaceSadCry } from '@fortawesome/free-solid-svg-icons'

import Header from '../Header'
import Footer from '../Footer'

const NotFound = () => {
  return (
    <>
    <Header/>
    <section className='notfound'> 
   
      <FontAwesomeIcon icon={faFaceSadCry} />
      <h1>404 - NotFound</h1>
    </section>
    <Footer/>
    </>
    

  )
}

export default NotFound