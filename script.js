// script.js
import { quizData } from './question/questions.js';

let currentQuestionIdx = 0;
let score = 0;
let wrongAnswers = 0;
let timerInterval;
let timeLeft = 15;
const timeLimit = 15;
let globalPlayerName = "Player"; 

// 🌐 1. टेलीग्राम वेबएप इनिशियलाइज़ेशन (बेहतर सुरक्षा चेक्स के साथ)
const tg = window.Telegram?.WebApp;

// इवेंट लिसनर्स बटन बाइंडिंग
document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('restart-btn').addEventListener('click', restartQuiz);

// थीम पैनल ट्रिगर्स
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

// 👤 2. टेलीग्राम डेटा एक्सट्रैक्शन फ़ंक्शन
function loadTelegramUser() {
    console.log("Checking Telegram WebApp context...");
    
    // टेलीग्राम के डेटा को पूरी तरह वेरीफाई करना
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        
        // नाम निकालना
        globalPlayerName = user.first_name || "Player";
        if (user.last_name) {
            globalPlayerName += ` ${user.last_name}`;
        }

        const usernameDisplay = user.username ? `@${user.username}` : globalPlayerName;
        
        // HTML एलिमेंट्स में यूज़र का लाइव डेटा सेट करना
        document.getElementById('user-display-name').innerText = usernameDisplay;
        document.getElementById('meta-user-id').innerText = user.id;
        document.getElementById('meta-user-lang').innerText = user.language_code ? user.language_code.toUpperCase() : "HI";
        
        // प्रोफ़ाइल पिक्चर सेट करना
        const avatarNode = document.getElementById('user-avatar');
        if (user.photo_url && user.photo_url.trim() !== "") {
            avatarNode.src = user.photo_url;
        } else {
            // फोटो न होने पर नाम के पहले अक्षरों का सुंदर अवतार बनाना
            const initials = `${user.first_name.charAt(0)}`.toUpperCase();
            avatarNode.src = `https://ui-avatars.com{initials}&background=4f46e5&color=fff&bold=true`;
        }
        
        // टेलीग्राम यूज़र के हिसाब से ऐप को रेडी और एक्सपैंड करना
        tg.ready();
        tg.expand();
        if (tg.colorScheme) {
            document.body.setAttribute('data-tg-theme', tg.colorScheme);
        }
    } else {
        // ⚠️ यह हिस्सा केवल तभी चलेगा जब आप ऐप को साधारण क्रोम/सफ़ारी ब्राउज़र में टेस्ट करेंगे
        console.log("Not in Telegram. Loading local browser fallback parameters.");
        globalPlayerName = "Guest Player";
        document.getElementById('user-display-name').innerText = "Guest Player";
        document.getElementById('meta-user-id').innerText = "--------";
        document.getElementById('meta-user-lang').innerText = "HI";
        document.getElementById('user-avatar').src = "https://liara.run";
    }
}

// ऐप लोड होते ही तुरंत यूज़र चेक रन करें
loadTelegramUser();


// ====================================================================
// 🎮 क्विज़ गेम इंजन लॉजिक फ़ंक्शंस
// ====================================================================
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
