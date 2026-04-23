// DOM Elements
const inputText = document.getElementById('inputText');
const startBtn = document.getElementById('startBtn');
const inputMode = document.getElementById('inputMode');
const halamanMode = document.getElementById('halamanMode');
const recordingMode = document.getElementById('recordingMode');
const resultMode = document.getElementById('resultMode');
const textDisplay = document.getElementById('textDisplay');
const timerDisplay = document.getElementById('timer');
const instructions = document.getElementById('instructions');
const nextBtn = document.getElementById('nextBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const retryBtn = document.getElementById('retryBtn');
const finishBtn = document.getElementById('finishBtn');
const restartBtn = document.getElementById('restartBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const transcriptBox = document.getElementById('transcriptBox');
const transcript = document.getElementById('transcript');
const resultBox = document.getElementById('resultBox');
const resultText = document.getElementById('resultText');
const accuracyScore = document.getElementById('accuracyScore');
const finalResult = document.getElementById('finalResult');

// State Variables
let text = '';
let cycle = 0;
let totalCycles = 10;
let interval;
let timeLeft = 300;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let cycleResults = [];

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'id-ID';
recognition.continuous = false;
recognition.interimResults = false;

// Start Hafalan
startBtn.addEventListener('click', function() {
    text = inputText.value.trim();
    if (text === '') {
        alert('Masukkan kalimat terlebih dahulu!');
        return;
    }
    
    inputMode.classList.add('hidden');
    halamanMode.classList.remove('hidden');
    cycleResults = [];
    startHafalan();
});

// Start Hafalan Session
function startHafalan() {
    cycle = 0;
    timeLeft = 300;
    updateTimer();
    startCycle();
    
    interval = setInterval(function() {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            endHalamanSession();
        }
    }, 1000);
}

// Start Individual Cycle
function startCycle() {
    if (cycle >= totalCycles) {
        endHalamanSession();
        return;
    }
    
    // Show text
    textDisplay.textContent = text;
    instructions.textContent = `Siklus ${cycle + 1}/${totalCycles} - Lihat dan ingat kalimatnya...`;
    nextBtn.classList.add('hidden');
    
    // Hide text after 5 seconds
    setTimeout(function() {
        textDisplay.textContent = '';
        instructions.textContent = 'Coba ingat kalimatnya tanpa melihat!';
        nextBtn.classList.remove('hidden');
    }, 5000);
}

// Next Cycle
nextBtn.addEventListener('click', function() {
    cycle++;
    startCycle();
});

// Update Timer
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// End Hafalan Session
function endHalamanSession() {
    clearInterval(interval);
    halamanMode.classList.add('hidden');
    recordingMode.classList.remove('hidden');
    recordBtn.classList.remove('hidden');
    textDisplay.textContent = text;
    instructions.textContent = '';
}

// Recording and Speech Recognition
recordBtn.addEventListener('click', async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            // Start speech recognition
            recognition.start();
            transcriptBox.classList.remove('hidden');
            transcript.textContent = 'Menganalisis ucapan...';
        };
        
        mediaRecorder.start();
        recordBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        recordingIndicator.classList.remove('hidden');
    } catch (error) {
        alert('Izinkan akses mikrofon untuk melanjutkan!');
    }
});

stopBtn.addEventListener('click', function() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        recordBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        recordingIndicator.classList.add('hidden');
    }
});

recognition.onresult = (event) => {
    let recognizedText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
        recognizedText += event.results[i][0].transcript;
    }
    
    transcript.textContent = recognizedText || '(Tidak ada ucapan terdeteksi)';
    compareTexts(text, recognizedText);
    
    retryBtn.classList.remove('hidden');
    finishBtn.classList.remove('hidden');
    recordBtn.classList.remove('hidden');
};

recognition.onerror = (event) => {
    transcript.textContent = `Error: ${event.error}. Silakan coba lagi.`;
    retryBtn.classList.remove('hidden');
    recordBtn.classList.remove('hidden');
};

// Compare and Calculate Accuracy
function compareTexts(original, recognized) {
    const originalLower = original.toLowerCase().trim();
    const recognizedLower = recognized.toLowerCase().trim();
    
    // Calculate accuracy using similarity
    const accuracy = calculateSimilarity(originalLower, recognizedLower);
    const isCorrect = accuracy >= 70;
    
    // Store result
    cycleResults.push({
        original: original,
        recognized: recognized,
        accuracy: accuracy,
        correct: isCorrect
    });
    
    // Display result
    resultBox.classList.remove('hidden');
    
    if (isCorrect) {
        resultText.textContent = '✓ BENAR!';
        resultText.className = 'correct';
    } else {
        resultText.textContent = '✗ KURANG TEPAT';
        resultText.className = 'incorrect';
    }
    
    accuracyScore.textContent = `Akurasi: ${accuracy.toFixed(1)}%`;
}

// Similarity Algorithm (Levenshtein Distance)
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = getEditDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
}

function getEditDistance(s1, s2) {
    const costs = [];
    
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
}

// Retry Recording
retryBtn.addEventListener('click', function() {
    transcriptBox.classList.add('hidden');
    resultBox.classList.add('hidden');
    retryBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    recordBtn.classList.remove('hidden');
    transcript.textContent = '';
    resultText.textContent = '';
    accuracyScore.textContent = '';
});

// Finish and Show Results
finishBtn.addEventListener('click', function() {
    recordingMode.classList.add('hidden');
    resultMode.classList.remove('hidden');
    
    // Calculate overall statistics
    const correctCount = cycleResults.filter(r => r.correct).length;
    const totalAttempts = cycleResults.length;
    const avgAccuracy = totalAttempts > 0 ? (cycleResults.reduce((sum, r) => sum + r.accuracy, 0) / totalAttempts).toFixed(1) : 0;
    
    finalResult.innerHTML = `
        <strong>Hasil Akhir Hafalan</strong><br>
        Kalimat: \"${text}\"<br><br>
        Total Percobaan: ${totalAttempts}<br>
        Benar: ${correctCount}/${totalAttempts}<br>
        Rata-rata Akurasi: ${avgAccuracy}%<br><br>
        ${avgAccuracy >= 85 ? '🎉 Excellent! Anda sudah hafal dengan sangat baik!' : avgAccuracy >= 70 ? '👍 Bagus! Terus berlatih.' : '💪 Terus berlatih untuk hasil yang lebih baik!'}
    `;
});

// Restart
restartBtn.addEventListener('click', function() {
    resultMode.classList.add('hidden');
    inputMode.classList.remove('hidden');
    inputText.value = '';
    textDisplay.textContent = '';
    instructions.textContent = '';
    transcriptBox.classList.add('hidden');
    resultBox.classList.add('hidden');
    cycleResults = [];
    cycle = 0;
});