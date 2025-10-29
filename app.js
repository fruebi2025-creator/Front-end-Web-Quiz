// Front-end Quiz Application
// Main JavaScript file handling all quiz functionality

class QuizApp {
    constructor() {
        // Application state
        this.state = {
            student: {
                name: '',
                email: '',
                whatsapp: ''
            },
            quizData: null,
            currentSubject: 0, // 0: HTML, 1: CSS, 2: JS
            subjects: ['HTML', 'CSS', 'JS'],
            subjectTitles: ['HTML Quiz', 'CSS Quiz', 'JavaScript Quiz'],
            subjectEmojis: ['🧩', '🎨', '💻'],
            currentQuestionIndex: 0,
            selectedQuestions: {
                HTML: [],
                CSS: [],
                JS: []
            },
            answers: {
                HTML: {},
                CSS: {},
                JS: {}
            },
            scores: {
                HTML: 0,
                CSS: 0,
                JS: 0
            },
            times: {
                HTML: 0,
                CSS: 0,
                JS: 0
            },
            timer: {
                startTime: null,
                timeRemaining: 5 * 60 * 1000, // 5 minutes in milliseconds
                interval: null
            },
            isQuizActive: false
        };

        // DOM elements
        this.elements = {
            // Sections
            landingSection: document.getElementById('landing-section'),
            quizSection: document.getElementById('quiz-section'),
            subjectResultsSection: document.getElementById('subject-results-section'),
            finalResultsSection: document.getElementById('final-results-section'),
            
            // Landing page
            studentForm: document.getElementById('student-form'),
            studentName: document.getElementById('student-name'),
            whatsappNumber: document.getElementById('whatsapp-number'),
            email: document.getElementById('email'),
            nameError: document.getElementById('name-error'),
            phoneError: document.getElementById('phone-error'),
            emailError: document.getElementById('email-error'),
            startExamBtn: document.getElementById('start-exam-btn'),
            
            // Quiz interface
            subjectTitle: document.getElementById('subject-title'),
            progressText: document.getElementById('progress-text'),
            progressFill: document.getElementById('progress-fill'),
            timerDisplay: document.getElementById('timer-display'),
            timer: document.getElementById('timer'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            submitSubjectBtn: document.getElementById('submit-subject-btn'),
            
            // Results
            subjectResultsTitle: document.getElementById('subject-results-title'),
            subjectScoreText: document.getElementById('subject-score-text'),
            subjectTimeText: document.getElementById('subject-time-text'),
            continueBtn: document.getElementById('continue-btn'),
            
            // Final results
            finalStudentName: document.getElementById('final-student-name'),
            finalStudentEmail: document.getElementById('final-student-email'),
            finalStudentPhone: document.getElementById('final-student-phone'),
            finalHtmlScore: document.getElementById('final-html-score'),
            finalCssScore: document.getElementById('final-css-score'),
            finalJsScore: document.getElementById('final-js-score'),
            finalHtmlTime: document.getElementById('final-html-time'),
            finalCssTime: document.getElementById('final-css-time'),
            finalJsTime: document.getElementById('final-js-time'),
            finalTotalScore: document.getElementById('final-total-score'),
            finalTotalTime: document.getElementById('final-total-time'),
            whatsappBtn: document.getElementById('whatsapp-btn'),
            restartBtn: document.getElementById('restart-btn'),
            
            // Loading and error
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            fallbackMessage: document.getElementById('fallback-message'),
            fallbackText: document.getElementById('fallback-text'),
            copyFallbackBtn: document.getElementById('copy-fallback-btn'),
            closeErrorBtn: document.getElementById('close-error-btn')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.setupFormValidation();
        
        // Preload quiz data in the background for faster start
        this.preloadQuizData();
    }

    async preloadQuizData() {
        try {
            console.log('Preloading quiz data in background...');
            
            const startBtn = this.elements.startExamBtn;
            if (startBtn) {
                startBtn.classList.add('loading');
                startBtn.textContent = 'Loading Questions...';
                startBtn.title = 'Loading 30 questions (10 per subject)...';
            }
            
            // Load data silently in background
            await this.loadQuizData();
            console.log('Quiz data preloaded successfully');
            
            // Show success indication on button
            if (startBtn && this.state.quizData) {
                startBtn.classList.remove('loading');
                startBtn.classList.add('ready');
                startBtn.textContent = 'Start Exam';
                startBtn.title = '30 questions loaded and ready! Click to start.';
                
                // Add a subtle success animation
                startBtn.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    startBtn.style.transform = 'scale(1)';
                }, 200);
            }
        } catch (error) {
            console.warn('Failed to preload quiz data:', error.message);
            
            const startBtn = this.elements.startExamBtn;
            if (startBtn) {
                startBtn.classList.remove('loading');
                startBtn.textContent = 'Start Exam';
                startBtn.title = 'Quiz data will load when you click start';
            }
        }
    }

    setupEventListeners() {
        // Form submission and validation
        this.elements.studentForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.elements.studentName.addEventListener('input', () => this.validateForm());
        this.elements.whatsappNumber.addEventListener('input', () => this.validateForm());
        this.elements.email.addEventListener('input', () => this.validateForm());

        // Quiz navigation
        this.elements.prevBtn.addEventListener('click', () => this.navigateQuestion(-1));
        this.elements.nextBtn.addEventListener('click', () => this.navigateQuestion(1));
        this.elements.submitSubjectBtn.addEventListener('click', () => this.submitSubject());

        // Results navigation
        this.elements.continueBtn.addEventListener('click', () => this.continueToNextSubject());
        this.elements.whatsappBtn.addEventListener('click', () => this.sendToWhatsApp());
        this.elements.restartBtn.addEventListener('click', () => this.restartQuiz());

        // Error handling
        this.elements.closeErrorBtn.addEventListener('click', () => this.closeErrorModal());
        this.elements.copyFallbackBtn.addEventListener('click', () => this.copyFallbackMessage());

        // Beforeunload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isQuizActive) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
                return e.returnValue;
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupFormValidation() {
        // Real-time validation
        this.elements.studentName.addEventListener('blur', () => this.validateName());
        this.elements.whatsappNumber.addEventListener('blur', () => this.validatePhone());
        this.elements.email.addEventListener('blur', () => this.validateEmail());
    }

    validateName() {
        const name = this.elements.studentName.value.trim();
        const nameError = this.elements.nameError;
        
        if (!name) {
            nameError.textContent = 'Full name is required';
            return false;
        } else if (name.length < 2) {
            nameError.textContent = 'Name must be at least 2 characters';
            return false;
        } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
            nameError.textContent = 'Name can only contain letters, spaces, hyphens, and apostrophes';
            return false;
        }
        
        nameError.textContent = '';
        return true;
    }

    validatePhone() {
        const phone = this.elements.whatsappNumber.value.trim();
        const phoneError = this.elements.phoneError;
        
        if (!phone) {
            phoneError.textContent = 'WhatsApp number is required';
            return false;
        } else if (!/^[0-9]{11,15}$/.test(phone)) {
            phoneError.textContent = 'Please enter a valid phone number (11-15 digits)';
            return false;
        }
        
        phoneError.textContent = '';
        return true;
    }

    validateEmail() {
        const email = this.elements.email.value.trim();
        const emailError = this.elements.emailError;
        
        if (!email) {
            emailError.textContent = 'Email address is required';
            return false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailError.textContent = 'Please enter a valid email address';
            return false;
        }
        
        emailError.textContent = '';
        return true;
    }

    validateForm() {
        const isNameValid = this.validateName();
        const isPhoneValid = this.validatePhone();
        const isEmailValid = this.validateEmail();
        
        const isFormValid = isNameValid && isPhoneValid && isEmailValid;
        
        // Only enable/disable if not currently loading
        if (!this.elements.startExamBtn.classList.contains('loading')) {
            this.elements.startExamBtn.disabled = !isFormValid;
        }
        
        return isFormValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        // Store student information
        this.state.student = {
            name: this.elements.studentName.value.trim(),
            email: this.elements.email.value.trim(),
            whatsapp: this.elements.whatsappNumber.value.trim()
        };

        // Save to localStorage
        this.saveToStorage();

        // Check if data is already preloaded
        if (this.state.quizData) {
            // Data is ready, start almost immediately
            this.startQuiz();
        } else {
            // Data not preloaded, load now
            try {
                await this.loadQuizData();
                this.startQuiz();
            } catch (error) {
                console.error('Quiz loading error:', error);
                this.showError('Failed to load quiz data. Please check your internet connection and try again.', error.message);
            }
        }
    }

    async loadQuizData() {
        // Check if data is already cached in memory
        if (this.state.quizData) {
            return;
        }

        try {
            console.log('Loading quiz data...');
            const startTime = performance.now();
            
            // Add timeout and better error handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('./quiz-data.json', {
                signal: controller.signal,
                cache: 'default', // Use browser cache for better performance
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to load quiz data (${response.status}): ${response.statusText}`);
            }
            
            // Use response.json() directly for better performance
            const data = await response.json();
            
            const loadTime = performance.now() - startTime;
            console.log(`Quiz data loaded in ${loadTime.toFixed(2)}ms`);
            
            // Validate data structure
            if (!data.HTML || !data.CSS || !data.JS) {
                throw new Error('Invalid quiz data structure: missing subject arrays');
            }
            
            if (data.HTML.length !== 40 || data.CSS.length !== 40 || data.JS.length !== 40) {
                throw new Error(`Invalid question counts: HTML(${data.HTML.length}), CSS(${data.CSS.length}), JS(${data.JS.length}). Expected 40 each.`);
            }
            
            // Validate question structure
            for (const subject of ['HTML', 'CSS', 'JS']) {
                for (const question of data[subject]) {
                    if (!question.id || !question.question || !question.options || question.answerIndex === undefined) {
                        throw new Error(`Invalid question structure in ${subject} section`);
                    }
                    if (question.options.length !== 4) {
                        throw new Error(`Question ${question.id} in ${subject} must have exactly 4 options`);
                    }
                    if (question.answerIndex < 0 || question.answerIndex > 3) {
                        throw new Error(`Question ${question.id} in ${subject} has invalid answerIndex`);
                    }
                }
            }
            
            this.state.quizData = data;
            this.selectRandomQuestions();
            
        } catch (error) {
            console.error('Error loading quiz data:', error);
            
            // Provide helpful error messages based on error type
            if (error.name === 'AbortError') {
                throw new Error('Loading timeout - please check your internet connection and try again');
            } else if (error.message.includes('fetch')) {
                throw new Error('Unable to load quiz data. Please ensure you are running this from a web server (not file://)');
            }
            
            throw error;
        }
    }

    selectRandomQuestions() {
        // Use crypto.getRandomValues if available, fallback to Math.random
        const getRandomArray = (length) => {
            if (window.crypto && window.crypto.getRandomValues) {
                const array = new Uint32Array(length);
                window.crypto.getRandomValues(array);
                return Array.from(array);
            } else {
                return Array.from({ length }, () => Math.floor(Math.random() * 1000000));
            }
        };

        // Fisher-Yates shuffle algorithm
        const shuffle = (array) => {
            const shuffled = [...array];
            const randomValues = getRandomArray(shuffled.length);
            
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = randomValues[i] % (i + 1);
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Select 10 random questions from each subject
        for (const subject of this.state.subjects) {
            const allQuestions = this.state.quizData[subject];
            const shuffledQuestions = shuffle(allQuestions);
            this.state.selectedQuestions[subject] = shuffledQuestions.slice(0, 10);
        }
    }

    startQuiz() {
        this.state.isQuizActive = true;
        this.state.currentSubject = 0;
        this.state.currentQuestionIndex = 0;
        
        this.showSection('quiz-section');
        this.setupSubject();
        this.startTimer();
        this.renderQuestion();
        this.updateProgress();
    }

    setupSubject() {
        const subjectName = this.state.subjects[this.state.currentSubject];
        const emoji = this.state.subjectEmojis[this.state.currentSubject];
        const title = `${emoji} ${this.state.subjectTitles[this.state.currentSubject]}`;
        
        this.elements.subjectTitle.textContent = title;
        
        // Reset timer for new subject
        this.state.timer.timeRemaining = 5 * 60 * 1000; // 5 minutes
        this.state.timer.startTime = Date.now();
        
        // Update navigation
        this.updateNavigation();
    }

    startTimer() {
        this.state.timer.startTime = Date.now();
        this.state.timer.timeRemaining = 5 * 60 * 1000;
        
        // Clear any existing timer
        if (this.state.timer.interval) {
            clearInterval(this.state.timer.interval);
        }
        
        // Update timer every second
        this.state.timer.interval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        this.updateTimer();
    }

    updateTimer() {
        const elapsed = Date.now() - this.state.timer.startTime;
        const remaining = Math.max(0, this.state.timer.timeRemaining - elapsed);
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer appearance based on time remaining
        const timerElement = this.elements.timer;
        timerElement.classList.remove('warning', 'danger');
        
        if (remaining <= 2 * 60 * 1000) { // 5 minutes or less
            timerElement.classList.add('warning');
        }
        if (remaining <= 1 * 60 * 1000) { // 2 minutes or less
            timerElement.classList.add('danger');
        }
        
        // Auto-submit when time expires
        if (remaining === 0) {
            this.submitSubject(true); // true indicates auto-submit
        }
    }

    renderQuestion() {
        const subjectName = this.state.subjects[this.state.currentSubject];
        const questions = this.state.selectedQuestions[subjectName];
        const question = questions[this.state.currentQuestionIndex];
        
        if (!question) {
            console.error('Question not found');
            return;
        }
        
        // Update question text
        this.elements.questionText.textContent = question.question;
        
        // Clear and populate options
        this.elements.optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            
            const optionId = `option-${index}`;
            const isSelected = this.state.answers[subjectName][question.id] === index;
            
            // Create input
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = optionId;
            input.name = 'current-question';
            input.value = index;
            if (isSelected) input.checked = true;
            
            // Create label
            const label = document.createElement('label');
            label.htmlFor = optionId;
            
            // Create indicator
            const indicator = document.createElement('span');
            indicator.className = 'option-indicator';
            
            // Create option text (using textContent to prevent HTML interpretation)
            const optionText = document.createElement('span');
            optionText.className = 'option-text';
            optionText.textContent = option;
            
            // Assemble elements
            label.appendChild(indicator);
            label.appendChild(optionText);
            optionElement.appendChild(input);
            optionElement.appendChild(label);
            
            // Add event listener for selection
            input.addEventListener('change', () => {
                this.selectAnswer(question.id, index);
            });
            
            this.elements.optionsContainer.appendChild(optionElement);
        });
        
        // Update progress and navigation
        this.updateProgress();
        this.updateNavigation();
        
        // Focus on first option for accessibility
        const firstOption = this.elements.optionsContainer.querySelector('input[type="radio"]');
        if (firstOption) {
            firstOption.focus();
        }
    }

    selectAnswer(questionId, answerIndex) {
        const subjectName = this.state.subjects[this.state.currentSubject];
        this.state.answers[subjectName][questionId] = answerIndex;
        
        // Save to localStorage
        this.saveToStorage();
    }

    updateProgress() {
        const current = this.state.currentQuestionIndex + 1;
        const total = 10;
        const percentage = (current / total) * 100;
        
        this.elements.progressText.textContent = `Question ${current} of ${total}`;
        this.elements.progressFill.style.width = `${percentage}%`;
    }

    updateNavigation() {
        const isFirstQuestion = this.state.currentQuestionIndex === 0;
        const isLastQuestion = this.state.currentQuestionIndex === 9;
        
        this.elements.prevBtn.disabled = isFirstQuestion;
        this.elements.nextBtn.textContent = isLastQuestion ? 'Finish Subject' : 'Next →';
    }

    navigateQuestion(direction) {
        const newIndex = this.state.currentQuestionIndex + direction;
        
        if (newIndex < 0 || newIndex >= 10) {
            if (direction > 0 && newIndex >= 10) {
                // Moved past last question, submit subject
                this.submitSubject();
            }
            return;
        }
        
        this.state.currentQuestionIndex = newIndex;
        this.renderQuestion();
    }

    submitSubject(isAutoSubmit = false) {
        // Stop timer
        if (this.state.timer.interval) {
            clearInterval(this.state.timer.interval);
        }
        
        // Calculate time spent
        const elapsed = Date.now() - this.state.timer.startTime;
        const timeSpent = Math.min(elapsed, 5 * 60 * 1000); // Cap at 5 minutes
        const subjectName = this.state.subjects[this.state.currentSubject];
        this.state.times[subjectName] = timeSpent;
        
        // Calculate score
        this.calculateSubjectScore();
        
        // Show subject results
        this.showSubjectResults(isAutoSubmit);
    }

    calculateSubjectScore() {
        const subjectName = this.state.subjects[this.state.currentSubject];
        const questions = this.state.selectedQuestions[subjectName];
        const answers = this.state.answers[subjectName];
        
        let score = 0;
        questions.forEach(question => {
            if (answers[question.id] === question.answerIndex) {
                score++;
            }
        });
        
        this.state.scores[subjectName] = score;
    }

    showSubjectResults(isAutoSubmit = false) {
        const subjectName = this.state.subjects[this.state.currentSubject];
        const emoji = this.state.subjectEmojis[this.state.currentSubject];
        const title = `${emoji} ${this.state.subjectTitles[this.state.currentSubject]} Results`;
        
        this.elements.subjectResultsTitle.textContent = title;
        this.elements.subjectScoreText.textContent = `${this.state.scores[subjectName]}/10`;
        this.elements.subjectTimeText.textContent = this.formatTime(this.state.times[subjectName]);
        
        // Update continue button text
        if (this.state.currentSubject === 2) { // Last subject
            this.elements.continueBtn.textContent = 'View Final Results';
        } else {
            const nextSubject = this.state.subjectTitles[this.state.currentSubject + 1];
            this.elements.continueBtn.textContent = `Continue to ${nextSubject}`;
        }
        
        this.showSection('subject-results-section');
        
        // Focus on continue button
        this.elements.continueBtn.focus();
        
        // Save progress
        this.saveToStorage();
    }

    continueToNextSubject() {
        if (this.state.currentSubject === 2) {
            // Show final results
            this.showFinalResults();
        } else {
            // Move to next subject
            this.state.currentSubject++;
            this.state.currentQuestionIndex = 0;
            this.setupSubject();
            this.startTimer();
            this.renderQuestion();
            this.showSection('quiz-section');
        }
    }

    showFinalResults() {
        this.state.isQuizActive = false;
        
        // Populate student information
        this.elements.finalStudentName.textContent = this.state.student.name;
        this.elements.finalStudentEmail.textContent = this.state.student.email;
        this.elements.finalStudentPhone.textContent = this.state.student.whatsapp;
        
        // Populate scores and times
        this.elements.finalHtmlScore.textContent = `${this.state.scores.HTML}/10`;
        this.elements.finalCssScore.textContent = `${this.state.scores.CSS}/10`;
        this.elements.finalJsScore.textContent = `${this.state.scores.JS}/10`;
        
        this.elements.finalHtmlTime.textContent = this.formatTime(this.state.times.HTML);
        this.elements.finalCssTime.textContent = this.formatTime(this.state.times.CSS);
        this.elements.finalJsTime.textContent = this.formatTime(this.state.times.JS);
        
        // Calculate totals
        const totalScore = this.state.scores.HTML + this.state.scores.CSS + this.state.scores.JS;
        const totalTime = this.state.times.HTML + this.state.times.CSS + this.state.times.JS;
        
        this.elements.finalTotalScore.textContent = `${totalScore}/30`;
        this.elements.finalTotalTime.textContent = this.formatTime(totalTime);
        
        this.showSection('final-results-section');
        
        // Focus on WhatsApp button
        this.elements.whatsappBtn.focus();
        
        // Clear localStorage
        this.clearStorage();
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    sendToWhatsApp() {
        try {
            const totalScore = this.state.scores.HTML + this.state.scores.CSS + this.state.scores.JS;
            const totalTime = this.state.times.HTML + this.state.times.CSS + this.state.times.JS;
            
            const message = `Student: ${this.state.student.name}
            Email: ${this.state.student.email}
            WhatsApp: ${this.state.student.whatsapp}
            Score HTML: ${this.state.scores.HTML}/10
            Score CSS: ${this.state.scores.CSS}/10
            Score JS: ${this.state.scores.JS}/10
            Total Score: ${totalScore}/30
            Total Time: ${this.formatTime(totalTime)}`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/09163106930?text=${encodedMessage}`;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Error sending to WhatsApp:', error);
            this.showFallbackMessage();
        }
    }

    showFallbackMessage() {
        const totalScore = this.state.scores.HTML + this.state.scores.CSS + this.state.scores.JS;
        const totalTime = this.state.times.HTML + this.state.times.CSS + this.state.times.JS;
        
        const message = `Student: ${this.state.student.name}
        Email: ${this.state.student.email}
        WhatsApp: ${this.state.student.whatsapp}
        Score HTML: ${this.state.scores.HTML}/10
        Score CSS: ${this.state.scores.CSS}/10
        Score JS: ${this.state.scores.JS}/10
        Total Score: ${totalScore}/30
        Total Time: ${this.formatTime(totalTime)}`;

        this.elements.fallbackText.value = message;
        this.elements.fallbackMessage.style.display = 'block';
        this.elements.errorMessage.textContent = 'Unable to open WhatsApp automatically. Please copy the message below and send it manually to 09163106930.';
        this.showErrorModal();
    }

    copyFallbackMessage() {
        this.elements.fallbackText.select();
        this.elements.fallbackText.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.elements.copyFallbackBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                this.elements.copyFallbackBtn.textContent = 'Copy Message';
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    }

    restartQuiz() {
        // Reset state
        this.state = {
            ...this.state,
            currentSubject: 0,
            currentQuestionIndex: 0,
            selectedQuestions: { HTML: [], CSS: [], JS: [] },
            answers: { HTML: {}, CSS: {}, JS: {} },
            scores: { HTML: 0, CSS: 0, JS: 0 },
            times: { HTML: 0, CSS: 0, JS: 0 },
            timer: { startTime: null, timeRemaining: 5 * 60 * 1000, interval: null },
            isQuizActive: false
        };
        
        // Clear timer
        if (this.state.timer.interval) {
            clearInterval(this.state.timer.interval);
        }
        
        // Clear form
        this.elements.studentForm.reset();
        this.elements.startExamBtn.disabled = true;
        this.clearErrorMessages();
        
        // Clear storage
        this.clearStorage();
        
        // Show landing page
        this.showSection('landing-section');
        this.elements.studentName.focus();
    }

    handleKeyboard(e) {
        // Handle Enter key on options
        if (e.target.type === 'radio' && e.key === 'Enter') {
            e.target.checked = true;
            e.target.dispatchEvent(new Event('change'));
        }
        
        // Handle arrow keys in quiz
        if (this.elements.quizSection.classList.contains('active')) {
            if (e.key === 'ArrowLeft' && !this.elements.prevBtn.disabled) {
                e.preventDefault();
                this.navigateQuestion(-1);
            } else if (e.key === 'ArrowRight' && this.state.currentQuestionIndex < 9) {
                e.preventDefault();
                this.navigateQuestion(1);
            }
        }
    }

    // Utility methods
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(sectionId).classList.add('active');
    }

    showError(message, details = '') {
        this.elements.errorMessage.textContent = message;
        this.elements.fallbackMessage.style.display = 'none';
        console.error('Quiz Error:', message, details);
        this.showErrorModal();
    }

    showErrorModal() {
        this.elements.errorModal.setAttribute('aria-hidden', 'false');
        this.elements.closeErrorBtn.focus();
    }

    closeErrorModal() {
        this.elements.errorModal.setAttribute('aria-hidden', 'true');
        this.elements.fallbackMessage.style.display = 'none';
    }

    clearErrorMessages() {
        this.elements.nameError.textContent = '';
        this.elements.phoneError.textContent = '';
        this.elements.emailError.textContent = '';
    }

    // Local storage methods
    saveToStorage() {
        const data = {
            student: this.state.student,
            currentSubject: this.state.currentSubject,
            currentQuestionIndex: this.state.currentQuestionIndex,
            answers: this.state.answers,
            scores: this.state.scores,
            times: this.state.times,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('quizProgress', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    loadStoredData() {
        try {
            const stored = localStorage.getItem('quizProgress');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Check if data is recent (within 24 hours)
                const isRecent = (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000;
                
                if (isRecent && data.student) {
                    // Restore form data
                    this.elements.studentName.value = data.student.name || '';
                    this.elements.whatsappNumber.value = data.student.whatsapp || '';
                    this.elements.email.value = data.student.email || '';
                    this.validateForm();
                }
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }

    clearStorage() {
        try {
            localStorage.removeItem('quizProgress');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }
}

// Initialize the quiz application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
