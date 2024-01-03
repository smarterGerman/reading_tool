import { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import './App.css'
import Feedback from './Feedback.tsx'

function App() {
  const sentences = [
    "Es ist ein schöner Montagmorgen in Berlin.",
    "Die Sonne scheint und die Vögel zwitschern fröhlich in den Bäumen.",
  ]

  const [sentenceIndex, setSentenceIndex] = useState(0)

  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  if (!browserSupportsSpeechRecognition) {
    return <>
      <p>Your browser does not support speech recognition!</p>
    </>
  }

  function toggleSpeechRecognition() {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      resetTranscript()
      SpeechRecognition.startListening({
        language: "de-DE",
        continuous: true
      })
    }
  }

  function nextSentence() {
    if (listening) {
      SpeechRecognition.stopListening()
    }
    resetTranscript()
    setSentenceIndex(sentenceIndex + 1)
  }

  function prevSentence() {
    if (listening) {
      SpeechRecognition.stopListening()
    }
    resetTranscript()
    setSentenceIndex(sentenceIndex - 1)
  }

  if(sentenceIndex === sentences.length) {
    return (
      <>
        <p>All sentences are completed!</p>
        <button onClick={prevSentence}>Back</button>
      </>)
  }

  return (
    <>
      <p>{sentences[sentenceIndex]}</p>
      <Feedback transcript={transcript} sentence={sentences[sentenceIndex]} listening={listening} />
      <button onClick={toggleSpeechRecognition}>🎤 {listening ? "Listening..." : ""}</button>
      { sentenceIndex > 0 ? <button onClick={prevSentence}>Back</button> : null}
      <button onClick={nextSentence}>Next</button>
    </>
  )
}

export default App
