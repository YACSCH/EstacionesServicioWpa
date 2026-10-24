const  DistribuidoresList = ({ distribuidores }) => {
  const filterDistibuidores = Object.values(distribuidores).filter((station) => station.id_region === "13");
  console.log(filterDistibuidores);
  return (
    <>
    {   filterDistibuidores ?
      Object.values(filterDistibuidores).map((item,index) => (
      <article className="card" key={index}>
        <h3 className="card-title">{item.nombre_empresa}</h3>
        <section className="card-body">
          <p className="card-text">Dirección: {item.ubicacion.direccion} {item.direccion_numero}</p>
          <p className="card-text">Comuna: {item.ubicacion.nombre_comuna}</p>
          <p className="card-text">Región: {item.ubicacion.nombre_region}</p>
          <p className="card-text">Horario : {item.horario_atencion}</p>

        </section>
      </article>
    )) :<>Sin informacion</> }
    </>
  )
}

export default DistribuidoresList