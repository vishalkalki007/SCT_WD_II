// State Engine Object
const calc = {
    displayValue: '0',
    historyValue: '',
    shouldResetDisplay: false
};

// UI DOM Targets
const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const btnGrid = document.getElementById('btnGrid');

// Main Controller: Updates the application screen view
function updateDisplay() {
    display.textContent = calc.displayValue;
    historyDisplay.textContent = calc.historyValue;
}

// Sub-Module: Parsing Inputs safely
function appendValue(value) {
    if (calc.shouldResetDisplay) {
        calc.displayValue = '';
        calc.shouldResetDisplay = false;
    }

    // Block duplicate decimals inside the same number block
    if (value === '.') {
        const structuralBlocks = calc.displayValue.split(/[\+\-\*\/%]/);
        const targetBlock = structuralBlocks[structuralBlocks.length - 1];
        if (targetBlock.includes('.')) return;
    }

    // Filter handling for redundant base zeroes
    if (calc.displayValue === '0' && value !== '.') {
        calc.displayValue = value;
    } else {
        // Enforce basic semantic filtering for chaining adjacent arithmetic operators
        const operators = ['+', '-', '*', '/', '%'];
        if (operators.includes(value) && operators.includes(calc.displayValue.slice(-1))) {
            calc.displayValue = calc.displayValue.slice(0, -1) + value; // Replace operator
            return;
        }
        calc.displayValue += value;
    }
}

// Sub-Module: Error Boundaries & Calculation Execution
function calculateResult() {
    let expression = calc.displayValue;
    if (!expression) return;

    // Prevent hanging trail operators before calculations run
    if (['+', '-', '*', '/', '%'].includes(expression.slice(-1))) {
        expression = expression.slice(0, -1);
    }

    try {
        // Safe Function Builder execution instead of naked global eval()
        // Replaces algebraic syntax characters safely back into programmatic formats
        const analyticalFormula = expression.replace(/×/g, '*').replace(/÷/g, '/');
        let rawOutcome = Function(`"use strict"; return (${analyticalFormula})`)();

        if (rawOutcome === undefined || isNaN(rawOutcome)) {
            throw new Error("Invalid Format");
        }
        if (!isFinite(rawOutcome)) {
            throw new Error("Zero Division");
        }

        // Precision handling: Truncate rounding noise past 8 decimal places
        if (rawOutcome.toString().includes('.')) {
            rawOutcome = parseFloat(rawOutcome.toFixed(8));
        }

        calc.historyValue = expression + " =";
        calc.displayValue = String(rawOutcome);
        calc.shouldResetDisplay = true;

    } catch (err) {
        // Route caught execution failures cleanly into visual screen warnings
        calc.displayValue = err.message === "Zero Division" ? "Error: Div by 0" : "Syntax Error";
        calc.historyValue = '';
        calc.shouldResetDisplay = true;
    }
}

// Processing Action Operations
function clearAll() {
    calc.displayValue = '0';
    calc.historyValue = '';
    calc.shouldResetDisplay = false;
}

function popCharacter() {
    if (calc.shouldResetDisplay) {
        clearAll();
        return;
    }
    if (calc.displayValue.length <= 1 || calc.displayValue === '0') {
        calc.displayValue = '0';
    } else {
        calc.displayValue = calc.displayValue.slice(0, -1);
    }
}

/* ==========================================
   EVENT HANDLERS & REGISTRATION
   ========================================== */

// Event Delegation Architecture (Tracks clicks through parent element)
btnGrid.addEventListener('click', (event) => {
    const target = event.target;
    if (!target.matches('button')) return;

    if (target.id === 'equalsBtn') {
        calculateResult();
    } else if (target.classList.contains('action')) {
        const action = target.dataset.action;
        if (action === 'clear') clearAll();
        if (action === 'delete') popCharacter();
    } else {
        appendValue(target.dataset.val);
    }
    updateDisplay();
});

// Native System Keyboard Input Handling
window.addEventListener('keydown', (e) => {
    // Intercept default space/enter page scrolling behaviors
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();

    if ((e.key >= '0' && e.key <= '9') || e.key === '.' || ['+', '-', '*', '/', '%'].includes(e.key)) {
        appendValue(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        calculateResult();
    } else if (e.key === 'Backspace') {
        popCharacter();
    } else if (e.key === 'Escape') {
        clearAll();
    }
    updateDisplay();
});