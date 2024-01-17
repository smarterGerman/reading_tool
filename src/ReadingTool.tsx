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
    "Es ist ein schöner Montagmorgen in Berlin.",
    "Die Sonne scheint und die Vögel zwitschern fröhlich in den Bäumen.",
  ]

  // Special values:
  // -1 - unstarted
  // sentences.length - finished
  // Change to -1 to show "Start" button
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [displayHelp, setDisplayHelp] = useState(false);

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

  async function goToSentence(index: number) {
    if (listening) {
      // If this is not awaited, resetting the transcript might not work as
      // speech recognition will still keep updating it for a few moments.
      await SpeechRecognition.stopListening()
    }
    resetTranscript()
    setSentenceIndex(index)
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
