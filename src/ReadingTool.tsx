import { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import './App.css'
import Feedback from './Feedback.tsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVolumeHigh, faMicrophone, faCircleQuestion, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useHotkeys } from 'react-hotkeys-hook'

type ReadingToolProps = {
  sentences?: string[]
}

function ReadingTool(props: ReadingToolProps) {
  const sentences = props.sentences || [
    // Default senteces are picked to simplify testing of various features.
    "Es ist ein schöner Montagmorgen in Berlin.",
    "Die Sonne scheint und die Vögel zwitschern fröhlich in den Bäumen.",
    // Speech recognition recognizes large numbers as numbers, but it should still match.
    "Ich habe vierzig Äpfel gekauft.",
    // Speech recognition recognizes small numbers as numbers, but it should still match.
    "Ich habe 7 Äpfel gekauft.",
    // zum Beispiel is recognized as "z. B." - adding this sentence so that I can easily test that that works.
    "Es gibt viele interessante Sehenswürdigkeiten in Berlin, zum Beispiel das Brandenburger Tor und das Berliner Dom.",
    // Speech recognition converts "halb 7" to "6:30"
    "Ich treffe dich um halb 7 am Bahnhof."
  ]

  // Special values:
  // -1 - unstarted
  // sentences.length - finished
  // Change to -1 to show "Start" button
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [displayHelp, setDisplayHelp] = useState(false);

  // Whether the app should listen when switching to the next sentence.
  // Generally, it should have the same value as `listening`, except for the
  // end screen after the last sentence.
  // When the user clicks Next after the last sentence and goes to the final
  // screen, the app will stop listening, but shouldListen will remain unchanged,
  // so that when the user clicks "Back" on the final screen, the app will start
  // listening again.
  const [shouldListen, setShouldListen] = useState(false);

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

  const listeningSettings = {
    language: "de-DE",
    continuous: true
  }

  function toggleSpeechRecognition() {
    if (sentenceIndex < 0 || sentenceIndex >= sentences.length) return
    if (listening) {
      setShouldListen(false)
      SpeechRecognition.stopListening()
    } else {
      resetTranscript()
      SpeechRecognition.startListening(listeningSettings)
      setShouldListen(true)
    }
  }

  async function goToSentence(index: number) {
    if (listening) {
      // If this is not awaited, resetting the transcript might not work as
      // speech recognition will still keep updating it for a few moments.
      await SpeechRecognition.stopListening()
    }
    resetTranscript()
    setSentenceIndex(index)
    if (index < sentences.length && shouldListen) {
      SpeechRecognition.startListening(listeningSettings)
    }
  }

  function nextSentence() {
    if(sentenceIndex < sentences.length) {
      goToSentence(sentenceIndex + 1)
    }
  }

  function prevSentence() {
    if(sentenceIndex > 0) {
      goToSentence(sentenceIndex - 1)
    }
  }

  useHotkeys("ArrowLeft", prevSentence)
  useHotkeys("ArrowRight", nextSentence)
  useHotkeys("Ctrl+Enter", toggleSpeechRecognition)

  function speakCurrentSentence() {
    if(sentenceIndex >= 0 && sentenceIndex < sentences.length) {
      speechSynthesis.cancel()
      let utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex])
      utterance.lang = "de"
      utterance.onerror = (e: any) => {
        console.log("TTS error: " + e.error)
        console.log("Message: " + e.message)
      }
      speechSynthesis.speak(utterance)
    }
  }

  // Uncomment for automatic TTS.
  // useEffect(speakCurrentSentence, [sentenceIndex])

  if(sentenceIndex < 0) {
    return <button onClick={nextSentence}>Start</button>
  }

  if(sentenceIndex === sentences.length) {
    return (
      <>
        <p>All sentences are completed!</p>
        <button onClick={prevSentence}>Back</button>
      </>)
  }

  const help = displayHelp ? (
    <>
      <p>Keyboard shortcuts:</p>
      <ul className='no-bullets'>
        <li><FontAwesomeIcon icon={faArrowLeft} /> - Back</li>
        <li><FontAwesomeIcon icon={faArrowRight} /> - Next</li>
        <li>Ctrl+Enter - Toggle recording</li>
      </ul>
    </>) : null

  return (
    <>
      <p>{sentences[sentenceIndex]}</p>
      <Feedback transcript={transcript} sentence={sentences[sentenceIndex]} listening={listening} />
      <button onClick={speakCurrentSentence}><FontAwesomeIcon icon={faVolumeHigh} /></button>
      <button onClick={toggleSpeechRecognition}><FontAwesomeIcon icon={faMicrophone} /> {listening ? "Listening..." : ""}</button>
      { sentenceIndex > 0 ? <button onClick={prevSentence}>Back</button> : null}
      <button onClick={nextSentence}>Next</button>
      <button onClick={() => setDisplayHelp(!displayHelp)}><FontAwesomeIcon icon={faCircleQuestion} /></button>
      {help}
    </>
  )
}

export default ReadingTool
