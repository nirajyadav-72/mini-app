// script.js
import { quizData } from './question/questions.js';

let currentQuestionIdx = 0;
let score = 0;
let wrongAnswers = 0;
let timerInterval;
let timeLeft = 15;
const timeLimit = 15;
let globalPlayerName = "Player"; 

// 🌐 1. CRITICAL TELEGRAM WEBAPP INSTANCE INITIALIZATION
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    // Synchronize design theme seamlessly with Telegram's native system colors
    if (tg.colorScheme) {
        document.body.setAttribute('data-tg-theme', tg.colorScheme);
    }
}

// Button Interface Event Binding Maps
document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('restart-btn').addEventListener('click', restartQuiz);

// Dynamic Theme Selector Overlay Configurations
const overlay = document.getElementById('theme-overlay');
document.getElementById('theme-trigger-btn').addEventListener('click', () => overlay.classList.add('open'));
document.getElementById('theme-close-btn').addEventListener('click', () => overlay.classList.remove('open'));

document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.theme-opt-btn').forEach(b => b.classList.remove('data-active'));
        e.target.classList.add('data-active');
        const newTheme = e.target.getAttribute('data-theme');
        document.body.className = '';
        document.body.classList.add(newTheme);
    });
});

// 👤 2. ULTRA-SECURE TELEGRAM DATA EXTRACTION ENGINE
(function initializeTelegramSession() {
    console.log("Initializing Telegram Secure Handshake...");
    
    // Check if the Unsafe Data Payload from the active Telegram wrapper exists
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        
        // Extract real-time display identity strings safely
        globalPlayerName = user.first_name || "Player";
        if (user.last_name) {
            globalPlayerName += ` ${user.last_name}`;
        }

        const usernameDisplay = user.username ? `@${user.username}` : globalPlayerName;
        
        // Inject variables straight into your UI container nodes
        document.getElementById('user-display-name').innerText = usernameDisplay;
        document.getElementById('meta-user-id').innerText = user.id;
        document.getElementById('meta-user-lang').innerText = user.language_code ? user.language_code.toUpperCase() : "EN-IN";
        
        // 📸 DYNAMIC PROFILE PICTURE (DP) PARSING ENGINE
        const avatarNode = document.getElementById('user-avatar');
        if (user.photo_url && user.photo_url.trim() !== "") {
            avatarNode.src = user.photo_url;
        } else {
            // Fallback generation based on initials if user hides their profile photo settings
            const initials = `${user.first_name.charAt(0)}${user.last_name ? user.last_name.charAt(0) : ''}`.toUpperCase();
            avatarNode.src = `https://ui-avatars.com/{initials}&background=4f46e5&color=fff&bold=true`;
        }
        
        console.log("Successfully extracted authenticated session profile for user ID:", user.id);
    } else {
        // Local Browser testing configurations fallback sandbox metrics
        console.warn("Telegram WebApp interface context not detected. Running fallback mockup configurations mode.");
        globalPlayerName = "Niraj Kumar";
        document.getElementById('user-display-name').innerText = "@Comeback_009";
        document.getElementById('meta-user-id').innerText = "7771481658";
        document.getElementById('meta-user-lang').innerText = "HI (Sandbox Mode)";
        document.getElementById('user-avatar').src = "https://liara.run";
    }
})();

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startQuiz() {
    currentQuestionIdx = 0;
    score = 0;
    wrongAnswers = 0;
    switchScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    clearInterval(timerInterval);
    timeLeft = timeLimit;
    document.getElementById('time-left').innerText = timeLeft;
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('explanation-box').style.display = 'none';
    
    const currentQuiz = quizData[currentQuestionIdx];
    
    document.getElementById('question-counter').innerText = `प्रश्न: ${currentQuestionIdx + 1}/${quizData.length}`;
    const progressPercent = (currentQuestionIdx / quizData.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;

    document.getElementById('question-text').innerText = `[${currentQuestionIdx + 1}/${quizData.length}] ${currentQuiz.question}`;

    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    
    currentQuiz.options.forEach((option, idx) => {
        const li = document.createElement('li');
        li.className = 'option-item';
        li.innerText = option;
        li.onclick = () => selectOption(idx, li);
        optionsList.appendChild(li);
    });

    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoTimeOut();
        }
    }, 1000);
}

function selectOption(selectedIdx, selectedElement) {
    clearInterval(timerInterval);
    const currentQuiz = quizData[currentQuestionIdx];
    const options = document.querySelectorAll('.option-item');

    options.forEach(opt => opt.classList.add('disabled'));

    if (selectedIdx === currentQuiz.correct) {
        selectedElement.classList.add('correct');
        score++;
    } else {
        selectedElement.classList.add('wrong');
        options[currentQuiz.correct].classList.add('correct');
        wrongAnswers++;
    }

    showExplanation(currentQuiz.explanation);
}

function autoTimeOut() {
    const currentQuiz = quizData[currentQuestionIdx];
    const options = document.querySelectorAll('.option-item');
    
    options.forEach(opt => opt.classList.add('disabled'));
    options[currentQuiz.correct].classList.add('correct');
    wrongAnswers++;

    showExplanation(`समय समाप्त! सही उत्तर: ${currentQuiz.explanation}`);
}

function showExplanation(text) {
    const expBox = document.getElementById('explanation-box');
    if (text) {
        expBox.innerHTML = `<b>📖 विवरण:</b> ${text}`;
        expBox.style.display = 'block';
    }
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentQuestionIdx++;
    if (currentQuestionIdx < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('progress-bar').style.width = '100%';
    switchScreen('result-screen');
    
    document.getElementById('result-user-name').innerText = globalPlayerName;
    document.getElementById('result-score').innerText = `${score}/${quizData.length}`;
    document.getElementById('stat-correct').innerText = score;
    document.getElementById('stat-wrong').innerText = wrongAnswers;
}

function restartQuiz() {
    switchScreen('start-screen');
        }
