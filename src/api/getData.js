import axios from 'axios'

export const GetToken =  async () => {
    const url = import.meta.env.VITE_URL_TOKEN
    const user = import.meta.env.VITE_USUARIO
    const pass = import.meta.env.VITE_PASS

    try {
        const response = await axios.post( url , 
                                            { email: user , 
                                              password:  pass }
          );
          return "Bearer " + response.data.token;
    } catch (error) {
       console.log(error) 
    }
}

export const GetEstaciones = async () => {
    const base_url = import.meta.env.VITE_URL_ESTACIONES
    const token = await GetToken() 
    
  try {
        const response = await axios.get(base_url, {
            headers: {
              'Authorization': token 
            }} );
          return response;
        
    } catch (error) {
       console.log(error) 
    }  
}
export const GetDistribuidores = async () => {
  const base_url = import.meta.env.VITE_URL_DISTRIBUIDORES
  const token = await GetToken()

try {
      const response = await axios.get(base_url, {
          headers: {
            'Authorization': token 
          }} );
        return response;
  } catch (error) {
     console.log(error) 
  }  
}
export const GetRegion = async  () => {
    const url = import.meta.env.VITE_URL_REGIONES
    try {
        const response = await axios.get(url);
           return response.data;
    } catch (error) {
       console.log(error) 
    }
}

export const GetComuna = async (props) => {
    const base_url = import.meta.env.VITE_URL_COMUNAS
    const url = base_url  + props 
    try {
        const response = await axios.get(url);
          return response.data;
    } catch (error) {
       console.log(error) 
    } 
}

