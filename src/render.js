const { desktopCapturer, remote } = require('electron')
const { writeFile } = require('fs')

const { Menu, dialog } = remote

const videoSelectBtn = document.getElementById('videoSelectBtn')
const videoElement = document.getElementById('videoEl')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')

let mediaRecorder // MediaRecorder instance to capture footage
const recordedChunks = []

// Captures all recorded chunks
const handleDataAvailable = (availableData) => {
  console.log('video data available')
  recordedChunks.push(availableData.data)
}

// Saves the video file on stop
const handleStop = async (data) => {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  })

  const buffer = Buffer.from(await blob.arrayBuffer())

  const { filePath } = await dialog.showSaveDialog({

    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  })

  writeFile(filePath, buffer, () => console.log('video saved successfully!'))
  recordedChunks.length = 0
}

// Change the videoSource window to record
const selectSource = async (source) => {
  videoSelectBtn.innerText = source.name

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  }

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // Preview the source in a video element
  videoElement.srcObject = stream
  videoElement.play()

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options)

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.onstop = handleStop
}

// get the available video sources
const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  })

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => (
      {
        label: source.name,
        click: () => selectSource(source)
      }
    ))
  )

  videoOptionsMenu.popup()
}

videoSelectBtn.onclick = getVideoSources

startBtn.onclick = (evt) => {
  mediaRecorder.start()
  startBtn.classList.add('is-danger')
  startBtn.innerText = 'Recording'
}

stopBtn.onclick = (evt) => {
  mediaRecorder.stop()
  startBtn.classList.remove('is-danger')
  startBtn.innerText = 'Start'
}
