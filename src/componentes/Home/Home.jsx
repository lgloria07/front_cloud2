import './Home.css'
import imgSubir from '../../assets/nube-subir.png';
import imgVideo from '../../assets/video.png'
import { useState, useRef } from 'react';
import { translateAudio } from '../../services/azureTranslator';

const Home = () => {

  const [idioma, setIdioma] = useState("");
  const [archivoSubido, setArchivoSubido] = useState(false); 
  const [ruta, setRuta] = useState(imgSubir);
  const [mensaje, setMensaje] = useState("Arrastra tu audio aquí o haz click para buscar");
  const refSubir = useRef(null);
  const refInput = useRef();
  const [file, setFile] = useState(null);
  const [audioTraducido, setAudioTraducido] = useState(null);
  const [traducido, setTraducido] = useState(false);

  const handleIdioma = (newIdioma) => {
    setIdioma(newIdioma);
  }

  //Funciones para manejar el drag and drop que permita subir el audio
  const handleDragOver = (e) => {
    e.preventDefault();
    if(archivoSubido == false){
      refSubir.current.style.backgroundColor = "#b3a1ea";
    }
  }

  const handleDragLeave = () => {
    if(archivoSubido == false){
      refSubir.current.style.backgroundColor = "#0F172A";
    }
  }

  const handleDrop = (e) => {
    if(archivoSubido == false){
      e.preventDefault();
      refSubir.current.style.backgroundColor = "#0F172A";
      const files = e.dataTransfer.files;
      const file = files[0];
      if(file.type.startsWith("audio/")){
        refSubir.current.classList.add("subirSinBorde");
        setArchivoSubido(true);
        setRuta(imgVideo);
        setMensaje("Audio cargado correctamente");
        setFile(file);
      }
      else{
        alert("Formato no valido, intentalo de nuevo");
        setArchivoSubido(false);
      }
    }
  }
  
  //Función para manejar el click que permite mostrar el sistema de archivos para subir un audio
  const handleClick = () => {
    refInput.current.click();
  }

  //Función para manejar el cambio del input que permite ingresar archivos en especifico audio
  const handleOnChange = (e) => {
    if(archivoSubido == false){
      e.preventDefault();
      const files = e.target.files;
      const file = files[0];
      if(file && file.type.startsWith("audio/")){
        refSubir.current.classList.add("subirSinBorde");
        setArchivoSubido(true);
        setRuta(imgVideo);
        setFile(file);
        setMensaje("Audio cargado correctamente");
      }else{
        setArchivoSubido(false);
        alert("Formato no valido o error al cargar el audio, intentalo de nuevo");
      }
    }
  }

  //Función asincrona para conexión a la ruta convert de la API local para convertir el audio a formato wav
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const convertirAWav = async (file) => {
    const formData = new FormData();
    formData.append("audio", file);

    const res = await fetch(`${API_URL}/convert`,  {
      method: "POST",
      body: formData
    });

    console.log("STATUS BACKEND:", res.status);
    console.log("CONTENT TYPE:", res.headers.get("content-type"));

    const audiofinal = await res.blob();
    console.log("BLOB TYPE:", audiofinal.type);
    console.log("BLOB SIZE:", audiofinal.size);

    return new File([audiofinal], "audio.wav", { type: "audio/wav" });
  };

  //Función asincrona para manejar la traducción del audio
  const handleSubir = async () => {
    if (archivoSubido && idioma !== "") {
      const idiomaMap = {"Ingles": "en","Japones": "ja", "Ruso": "ru", "Español": "es"};
      const wavFile = await convertirAWav(file);
      const result = await translateAudio(wavFile,"es-MX",idiomaMap[idioma]);

      setAudioTraducido(result.audioBlob);
      setTraducido(true);
    } else {
      alert("Asegurate de adjuntar un audio y seleccionar un idioma");
    }
  };

  //Función para limpiar las variables
  const handleVolver = () => {
    setIdioma("");
    setArchivoSubido(false);
    setRuta(imgSubir);
    setMensaje("Arrastra tu audio aquí o haz click para buscar");
    setFile(null);
    setAudioTraducido(null);
    setTraducido(false);
  }

  return (
    <>
      {
        !traducido 
        ? 
        (
          <div className='container'>
            <h2 style={{color: '#F8FAFC'}}>Audio Translator</h2>
            <div className='subirVideo'
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e)}
              ref={refSubir}
              onClick={() => {handleClick()}}>
              
              <p style={{color: '#F8FAFC'}}>{mensaje}</p>
              <img src={ruta}/>
            </div>

            <input
              type='file'
              accept='audio/*'
              ref={refInput}
              style={{display: 'none'}}
              onChange={(e) => {handleOnChange(e)}}
            />

            <p style={{color: '#9fabbb', fontSize: '12px'}}>
              Opciones de traducción<br></br>
              ¡Rompe las barreras del idioma!
            </p>

            <div className='containerBotones'>
              <button className='botonConfig' onClick={() => handleIdioma("Ingles")}>Ingles</button>
              <button className='botonConfig' onClick={() => handleIdioma("Japones")}>Japones</button>
              <button className='botonConfig' onClick={() => handleIdioma("Ruso")}>Ruso</button>
              <button className='botonConfig' onClick={() => handleIdioma("Español")}>Español</button>
            </div>

            <button className='botonSubir' onClick={() => handleSubir()}>
              Subir audio y traducir
            </button>
          </div>
        )
        : 
        (
          <div className='container'>
            <div className="containerTitle">
              <p style={{fontSize: 30, fontWeight: 'bold'}}>Resultados</p>
            </div>

            <div className='containerAudio'>
              <p style={{fontSize: 20, fontWeight: 'bold'}}>Original</p>
              <audio controls src={URL.createObjectURL(file)} style={{width: '80%', height: '35%'}}></audio>
            </div>

            <div className='containerAudio'>
              <p style={{fontSize: 20, fontWeight: 'bold'}}>Traducido</p>
              <audio controls src={URL.createObjectURL(audioTraducido)} style={{width: '80%', height: '35%'}}></audio>
            </div>

            <button className='botonVolver' onClick={() => {handleVolver()}}>
              Regresar
            </button>
          </div>
        )
      }
    </>
  )
}

export default Home;