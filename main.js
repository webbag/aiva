
console.log(OPENAI_API_KEY); 
console.log(MAKE_API_KEY); 

function initializeRecorder() {
    const startRecordingButton = document.getElementById('startRecording');
    let mediaRecorder;
    let audioChunks = [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'recording.mp3');
                    formData.append('model', 'whisper-1');
                    formData.append('language', 'en');

                    fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            Authorization: `Bearer ${OPENAI_API_KEY}`
                        }
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Odpowiedź serwera OpenAI:', data.text);

                            const url = MAKE_API_KEY;
                            const options = {
                                method: 'POST',
                                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({ txt: data.text })
                            };

                            fetch(url, options)
                            .then(response => response.text())
                            .then(dataResponse => {
                                console.log(dataResponse);
                        
                                fetch("https://api.openai.com/v1/audio/speech", {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        model: "tts-1",
                                        input: dataResponse,
                                        voice: "alloy",
                                    }),
                                })
                                .then((response) => response.blob())
                                .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const audio = new Audio(url);
                                    audio.play();
                                    // Nie trzeba już dodawać linka do dokumentu ani wywoływać a.click() ani window.URL.revokeObjectURL(url)
                                })
                                .catch((error) => console.error("Error:", error));
                            })
                            .catch((error) => console.error("Error:", error));                                                          

                        })
                        .catch(error => {
                            console.error('Błąd podczas wysyłania danych:', error);
                        });

                    audioChunks = [];
                };

                startRecordingButton.addEventListener('click', () => {
                    if (mediaRecorder.state === 'inactive') {
                        mediaRecorder.start();
                        startRecordingButton.textContent = 'Zatrzymaj nagrywanie';
                    } else {
                        mediaRecorder.stop();
                        startRecordingButton.textContent = 'Rozpocznij nagrywanie';
                    }
                });
            })
            .catch(error => {
                console.error('Błąd podczas uzyskiwania dostępu do mikrofonu:', error);
            });
    } else {
        console.error('Twoja przeglądarka nie obsługuje nagrywania audio.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeRecorder();
});