// Dados dos exercícios
const exercises = [
    { num1: 544, num2: 256, result: 800 },
    { num1: 624, num2: 347, result: 971 },
    { num1: 564, num2: 288, result: 852 },
    { num1: 545, num2: 286, result: 831 },
    { num1: 654, num2: 268, result: 922 },
    { num1: 458, num2: 259, result: 717 },
    { num1: 532, num2: 399, result: 931 },
    { num1: 445, num2: 298, result: 743 },
    { num1: 546, num2: 298, result: 844 }
];

// Elementos do DOM
const number1El = document.getElementById('number1');
const number2El = document.getElementById('number2');
const resultEl = document.getElementById('result');
const stepDescriptionEl = document.getElementById('step-description');
const currentExerciseEl = document.getElementById('current-exercise');
const totalExercisesEl = document.getElementById('total-exercises');
const carryUnitsEl = document.getElementById('carry-units');
const carryTensEl = document.getElementById('carry-tens');
const carryHundredsEl = document.getElementById('carry-hundreds');
const nextStepBtn = document.getElementById('next-step-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const resetBtn = document.getElementById('reset-btn');
const audioBtn = document.getElementById('audio-btn');
const hintBtn = document.getElementById('hint-btn');
const extraHintEl = document.getElementById('extra-hint');

// Estado da aplicação
let currentExercise = 0;
let currentStep = 0;
let audioEnabled = false;
let userProgress = JSON.parse(localStorage.getItem('somaColunaProgress')) || {};

// Inicialização
function init() {
    totalExercisesEl.textContent = exercises.length;
    loadExercise(currentExercise);
    
    // Verificar se há progresso salvo
    if (userProgress[currentExercise]) {
        currentStep = userProgress[currentExercise].step || 0;
        updateDisplay();
    }
}

// Carregar exercício
function loadExercise(index) {
    const exercise = exercises[index];
    number1El.textContent = exercise.num1;
    number2El.textContent = `+${exercise.num2}`;
    resultEl.textContent = '???';
    currentExerciseEl.textContent = index + 1;
    
    // Resetar carries
    carryUnitsEl.textContent = '';
    carryTensEl.textContent = '';
    carryHundredsEl.textContent = '';
    
    // Resetar steps
    currentStep = 0;
    stepDescriptionEl.textContent = "Clique em 'Próximo Passo' para começar";
    
    // Atualizar botões de navegação
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === exercises.length - 1;
}

// Executar próximo passo
function nextStep() {
    const exercise = exercises[currentExercise];
    const num1 = exercise.num1;
    const num2 = exercise.num2;
    
    // Obter dígitos
    const units1 = num1 % 10;
    const units2 = num2 % 10;
    const tens1 = Math.floor((num1 % 100) / 10);
    const tens2 = Math.floor((num2 % 100) / 10);
    const hundreds1 = Math.floor(num1 / 100);
    const hundreds2 = Math.floor(num2 / 100);
    
    switch (currentStep) {
        case 0:
            // Passo 1: Somar unidades
            stepDescriptionEl.innerHTML = `Some as <span class="highlight">unidades</span>: ${units1} + ${units2} = ${units1 + units2}`;
            if (audioEnabled) speak(`Some as unidades: ${units1} mais ${units2}`);
            currentStep = 1;
            break;
            
        case 1:
            // Passo 2: Calcular vai-um das unidades
            const unitsSum = units1 + units2;
            if (unitsSum >= 10) {
                const unitsResult = unitsSum % 10;
                const carry = Math.floor(unitsSum / 10);
                carryTensEl.textContent = `+${carry}`;
                stepDescriptionEl.innerHTML = `Como ${units1} + ${units2} = ${unitsSum} (que é maior que 9),<br>escrevemos <span class="highlight">${unitsResult}</span> e <span class="highlight">vai ${carry}</span> para as dezenas`;
                if (audioEnabled) speak(`Escreva ${unitsResult} e vai ${carry} para as dezenas`);
                // Atualizar resultado parcial
                resultEl.textContent = unitsResult.toString().padStart(3, ' ');
            } else {
                stepDescriptionEl.innerHTML = `Como ${units1} + ${units2} = ${unitsSum},<br>escrevemos <span class="highlight">${unitsSum}</span> como resultado das unidades`;
                if (audioEnabled) speak(`Escreva ${unitsSum} como resultado das unidades`);
                // Atualizar resultado parcial
                resultEl.textContent = unitsSum.toString().padStart(3, ' ');
            }
            currentStep = 2;
            break;
            
        case 2:
            // Passo 3: Somar dezenas
            const carryTens = carryTensEl.textContent ? parseInt(carryTensEl.textContent.replace('+', '')) : 0;
            const tensSum = tens1 + tens2 + carryTens;
            stepDescriptionEl.innerHTML = `Some as <span class="highlight">dezenas</span>: ${tens1} + ${tens2} + ${carryTens || 0} = ${tensSum}`;
            if (audioEnabled) speak(`Some as dezenas: ${tens1} mais ${tens2} mais ${carryTens || 0}`);
            currentStep = 3;
            break;
            
        case 3:
            // Passo 4: Calcular vai-um das dezenas
            const carryTensValue = carryTensEl.textContent ? parseInt(carryTensEl.textContent.replace('+', '')) : 0;
            const tensSumValue = tens1 + tens2 + carryTensValue;
            
            if (tensSumValue >= 10) {
                const tensResult = tensSumValue % 10;
                const carry = Math.floor(tensSumValue / 10);
                carryHundredsEl.textContent = `+${carry}`;
                stepDescriptionEl.innerHTML = `Como ${tens1} + ${tens2} + ${carryTensValue || 0} = ${tensSumValue},<br>escrevemos <span class="highlight">${tensResult}</span> e <span class="highlight">vai ${carry}</span> para as centenas`;
                if (audioEnabled) speak(`Escreva ${tensResult} e vai ${carry} para as centenas`);
                // Atualizar resultado parcial
                const currentResult = resultEl.textContent;
                resultEl.textContent = tensResult + currentResult.slice(1);
            } else {
                stepDescriptionEl.innerHTML = `Como ${tens1} + ${tens2} + ${carryTensValue || 0} = ${tensSumValue},<br>escrevemos <span class="highlight">${tensSumValue}</span> como resultado das dezenas`;
                if (audioEnabled) speak(`Escreva ${tensSumValue} como resultado das dezenas`);
                // Atualizar resultado parcial
                const currentResult = resultEl.textContent;
                resultEl.textContent = tensSumValue + currentResult.slice(1);
            }
            currentStep = 4;
            break;
            
        case 4:
            // Passo 5: Somar centenas
            const carryHundreds = carryHundredsEl.textContent ? parseInt(carryHundredsEl.textContent.replace('+', '')) : 0;
            const hundredsSum = hundreds1 + hundreds2 + carryHundreds;
            stepDescriptionEl.innerHTML = `Some as <span class="highlight">centenas</span>: ${hundreds1} + ${hundreds2} + ${carryHundreds || 0} = ${hundredsSum}`;
            if (audioEnabled) speak(`Some as centenas: ${hundreds1} mais ${hundreds2} mais ${carryHundreds || 0}`);
            currentStep = 5;
            break;
            
        case 5:
            // Passo 6: Mostrar resultado final
            const carryHundredsValue = carryHundredsEl.textContent ? parseInt(carryHundredsEl.textContent.replace('+', '')) : 0;
            const hundredsSumValue = hundreds1 + hundreds2 + carryHundredsValue;
            
            stepDescriptionEl.innerHTML = `Resultado final: <span class="highlight">${exercises[currentExercise].result}</span>`;
            if (audioEnabled) speak(`Resultado final: ${exercises[currentExercise].result}`);
            
            // Mostrar resultado completo
            resultEl.textContent = exercises[currentExercise].result.toString();
            
            // Desabilitar botão de próximo passo
            nextStepBtn.disabled = true;
            
            // Salvar progresso
            saveProgress();
            currentStep = 6;
            break;
    }
    
    // Salvar progresso a cada passo
    saveProgress();
}

// Salvar progresso no localStorage
function saveProgress() {
    if (!userProgress[currentExercise]) {
        userProgress[currentExercise] = {};
    }
    userProgress[currentExercise].step = currentStep;
    userProgress[currentExercise].completed = currentStep === 6;
    localStorage.setItem('somaColunaProgress', JSON.stringify(userProgress));
}

// Atualizar display com base no progresso salvo
function updateDisplay() {
    const exercise = exercises[currentExercise];
    const progress = userProgress[currentExercise] || {};
    
    if (progress.step > 0) {
        // Recriar a interface com base no progresso salvo
        // (implementação simplificada - recomeçar do último passo salvo)
        loadExercise(currentExercise);
        
        // Avançar até o passo salvo
        for (let i = 0; i < progress.step; i++) {
            nextStep();
        }
    }
}

// Sintetizar voz
function speak(text) {
    if ('speechSynthesis' in window && audioEnabled) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

// Event Listeners
nextStepBtn.addEventListener('click', nextStep);

prevBtn.addEventListener('click', () => {
    if (currentExercise > 0) {
        currentExercise--;
        loadExercise(currentExercise);
        
        // Recuperar progresso salvo se existir
        if (userProgress[currentExercise]) {
            currentStep = userProgress[currentExercise].step || 0;
            updateDisplay();
        }
    }
});

nextBtn.addEventListener('click', () => {
    if (currentExercise < exercises.length - 1) {
        currentExercise++;
        loadExercise(currentExercise);
        
        // Recuperar progresso salvo se existir
        if (userProgress[currentExercise]) {
            currentStep = userProgress[currentExercise].step || 0;
            updateDisplay();
        }
    }
});

resetBtn.addEventListener('click', () => {
    loadExercise(currentExercise);
});

audioBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioBtn.textContent = audioEnabled ? '🔊 Áudio Ativo' : '🔊 Áudio';
    audioBtn.style.backgroundColor = audioEnabled ? '#10b981' : '#3b82f6';
});

hintBtn.addEventListener('click', () => {
    extraHintEl.classList.toggle('hidden');
    hintBtn.textContent = extraHintEl.classList.contains('hidden') ? 
        'Mostrar Dica Extra' : 'Ocultar Dica';
});

// Inicializar a aplicação
init();