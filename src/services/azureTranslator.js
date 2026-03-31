//sdk d azure para traducir y genera voz
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

//voces q usaremos para el idioma escogido
const voiceMap = {
    "en": "en-US-AriaNeural",    
    "ja": "ja-JP-NanamiNeural",  
    "ru": "ru-RU-SvetlanaNeural",
    "es": "es-MX-DaliaNeural"
};

//FUNCION PARA LA TRADUCCION, ESTA ES LA Q HAY Q IMPORTA
//recibimos el audio, el idioma d origen y el idioma al que queremos traducir
export const translateAudio = (audioFile, sourceLanguage = "es-MX", targetLanguage) => {
    return new Promise((resolve, reject) => {
        //las credenciales 
        const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;
        
        // por si no hay nada
        if (!speechKey || !speechRegion) {
            return reject(new Error("Faltan las credenciales de Azure en .env"));
        }

        //Declaración del objeto que nos va ayudar a leer los bits del audio
        const reader = new FileReader();

        //Definición del método para cuando el audio termine de cargar
        reader.onload = () => {
            try {
                //Obtención de los bits del audio 
                /*
                const audioData = reader.result;
                Si solo se coloca como en la línea de arriba estamos pasando un puntero a los datos
                pero no deja leerlos, al usar Unit8Array nos da una vista de esos datos permitiendo que se 
                lean y procesen
                */
                const audioData = new Uint8Array(reader.result);

                //configuramos la traduccion y el reconocimiento del audio con las llaves que tenemos 
                const translationConfig = sdk.SpeechTranslationConfig.fromSubscription(speechKey, speechRegion);

                //le decimos el idioma del audio/para nuestro caso por defecto es español de mexico
                translationConfig.speechRecognitionLanguage = sourceLanguage;

                //el idoma al q traducir
                translationConfig.addTargetLanguage(targetLanguage);

                // se convierte el auido 

                // antes se usaba fromWavFileInput, pero aqui usamos un stream para leer mejor el archivo subido

                /*
                Esta forma nos funciona si tenemos el audio crudo, tal como cuando se espera que se grabe el audio 
                directamente desde la aplicación

                const pushStream = sdk.AudioInputStream.createPushStream();
                pushStream.write(audioData);
                pushStream.close();

                const audioInputConfig = sdk.AudioConfig.fromStreamInput(pushStream);

                //se crea el reconocedor de la traduccion
                const recognizer = new sdk.TranslationRecognizer(translationConfig, audioInputConfig);
                */
                
                //configuracion del audio con el formato wav para respetar los encabezados y estructura del audio
                const audioInputConfig = sdk.AudioConfig.fromWavFileInput(audioData);

                //se crea el reconocedor de la traduccion
                const recognizer = new sdk.TranslationRecognizer(translationConfig, audioInputConfig);

                //instruccines para el reconomineot y la traduccion
                recognizer.recognizeOnceAsync(
                    (result) => {
                        if (result.reason === sdk.ResultReason.TranslatedSpeech) {
                            //se tiene el texto traducido
                            const translatedText = result.translations.get(targetLanguage);

                            //configuracion del speech 
                            const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);

                            //se elige la voz segun el idoma q se escoja, o default la vox en inlges
                            speechConfig.speechSynthesisVoiceName = voiceMap[targetLanguage] || "en-US-AriaNeural";
                            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

                            //se creae el sintetizador de la voz
                            const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

                            //se le da el texto para que lo diga
                            synthesizer.speakTextAsync(
                                translatedText,
                                (synthResult) => {
                                    if (synthResult.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                                        //se crea un blob con el audio generado para poder reproducirlo o descargarlo
                                        const audioBlob = new Blob([synthResult.audioData], { type: "audio/wav" });

                                        resolve({
                                            texto: translatedText,
                                            audioBlob: audioBlob
                                        });
                                    } else {
                                        reject(new Error("Se tradujo el texto, pero falló la generación de voz."));
                                    }
                                    synthesizer.close();
                                },
                                (err) => {
                                    reject(new Error(`Error en síntesis: ${err}`));
                                    synthesizer.close();
                                }
                            );

                        } else {
                            reject(new Error("No se pudo reconocer o traducir el audio."));
                        }
                        recognizer.close();
                    },
                    (error) => {
                        reject(new Error(`Error en reconocimiento: ${error}`));
                        recognizer.close();
                    }
                );
            } catch (err) {
                reject(new Error(`Error procesando audio: ${err.message}`)); 
            }
        };

        //Definición del método en caso de que al intentar cargarse el audio dispara un error
        reader.onerror = () => {
            reject(new Error("No se pudo leer el archivo de audio."));
        };
        //El objeto reader lee el audio en bits
        //Si se lee de forma correcta se dispara el onload definido arriba
        //Si no se lee de forma correcta se dispara el onerror definido arriba
        reader.readAsArrayBuffer(audioFile);
    });
};