/**
 * Raspberry Pi Lessons - Main Logic
 */

const state = {
    lessons: [],
    currentLessonIndex: 0,
    currentStepIndex: 0
};

// UI Elements
const lessonList = document.getElementById('lesson-list');
const stepTitle = document.getElementById('step-title');
const stepBody = document.getElementById('step-body');
const stepCounter = document.getElementById('step-counter');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const copyModal = document.getElementById('copy-modal');
const closeModal = document.getElementById('close-modal');

/**
 * Initialize the application
 */
async function init() {
    await loadLessons();
    if (state.lessons.length > 0) {
        renderLessonList();
        renderCurrentStep();
    } else {
        stepTitle.innerText = "Nessuna lezione trovata";
        stepBody.innerHTML = "<p>Controlla che i file .md siano nella cartella 'lessons'.</p>";
    }

    setupEventListeners();
}

/**
 * Load lessons sequentially until a file is not found
 */
async function loadLessons() {
    let index = 1;
    let fallback = false;

    while (!fallback) {
        try {
            const response = await fetch(`lessons/${index}.md`);
            if (!response.ok) throw new Error("Not found");
            
            const text = await response.text();
            const lesson = parseMarkdown(text, index);
            state.lessons.push(lesson);
            index++;
        } catch (e) {
            fallback = true;
        }
    }
}

/**
 * Parse markdown into steps based on ## headers
 */
function parseMarkdown(text, index) {
    const lines = text.split('\n');
    const steps = [];
    let currentStep = null;

    // Get the main title (# Header)
    const mainTitleMatch = text.match(/^# (.*)$/m);
    const mainTitle = mainTitleMatch ? mainTitleMatch[1] : `Lezione ${index}`;

    lines.forEach(line => {
        if (line.startsWith('## ')) {
            if (currentStep) steps.push(currentStep);
            currentStep = {
                title: line.replace('## ', '').trim(),
                content: ''
            };
        } else if (currentStep) {
            currentStep.content += line + '\n';
        }
    });

    if (currentStep) steps.push(currentStep);

    return {
        id: index,
        mainTitle: mainTitle,
        steps: steps
    };
}

/**
 * Render the list of lessons in the sidebar
 */
function renderLessonList() {
    lessonList.innerHTML = '';
    state.lessons.forEach((lesson, index) => {
        const li = document.createElement('li');
        li.className = `lesson-item ${index === state.currentLessonIndex ? 'active' : ''}`;
        li.innerText = lesson.mainTitle;
        li.onclick = () => {
            state.currentLessonIndex = index;
            state.currentStepIndex = 0;
            renderLessonList();
            renderCurrentStep();
        };
        lessonList.appendChild(li);
    });
}

/**
 * Render the current step content
 */
function renderCurrentStep() {
    const lesson = state.lessons[state.currentLessonIndex];
    if (!lesson || !lesson.steps.length) return;

    const step = lesson.steps[state.currentStepIndex];
    
    // Update content
    stepTitle.innerText = step.title;
    stepBody.innerHTML = marked.parse(step.content);

    // Update counter and progress
    const totalSteps = lesson.steps.length;
    stepCounter.innerText = `${state.currentStepIndex + 1} / ${totalSteps}`;
    
    const progress = ((state.currentStepIndex + 1) / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;

    // Update buttons
    prevBtn.disabled = state.currentStepIndex === 0;
    nextBtn.innerText = state.currentStepIndex === totalSteps - 1 ? 'Fine Lezione' : 'Avanti';

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Navigation logic
 */
function nextStep() {
    const lesson = state.lessons[state.currentLessonIndex];
    if (state.currentStepIndex < lesson.steps.length - 1) {
        state.currentStepIndex++;
        renderCurrentStep();
    } else if (state.currentLessonIndex < state.lessons.length - 1) {
        // Move to next lesson
        state.currentLessonIndex++;
        state.currentStepIndex = 0;
        renderLessonList();
        renderCurrentStep();
    }
}

function prevStep() {
    if (state.currentStepIndex > 0) {
        state.currentStepIndex--;
        renderCurrentStep();
    }
}

/**
 * Event listeners
 */
function setupEventListeners() {
    nextBtn.addEventListener('click', nextStep);
    prevBtn.addEventListener('click', prevStep);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            nextStep();
        } else if (e.key === 'ArrowLeft') {
            prevStep();
        }
    });

    // Content area click to advance
    document.querySelector('.content').addEventListener('click', (e) => {
        // Don't advance if clicking the sidebar or buttons or modal
        if (e.target.closest('.sidebar') || e.target.closest('.nav-controls') || e.target.closest('.modal-content')) return;
        nextStep();
    });

    // Anti-copy Protections
    const showModal = (e) => {
        e.preventDefault();
        copyModal.style.display = 'flex';
    };

    document.addEventListener('contextmenu', showModal);
    document.addEventListener('copy', showModal);
    document.addEventListener('selectstart', showModal);

    closeModal.addEventListener('click', () => {
        copyModal.style.display = 'none';
    });
}

// Start the app
init();
