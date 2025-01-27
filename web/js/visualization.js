// CPU Visualization and Control
class CPUVisualizer {
    constructor() {
        this.running = false;
        this.cycle = 0;
        this.performanceData = {
            ipc: [],
            cacheHits: 0,
            cacheMisses: 0,
            branchPredictions: {
                correct: 0,
                incorrect: 0
            }
        };
        this.initializeCharts();
        this.initializeControls();
    }

    initializeCharts() {
        // IPC Chart
        const ipcCtx = document.getElementById('ipcChart').getContext('2d');
        this.ipcChart = new Chart(ipcCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Instructions Per Cycle',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Cache Performance Chart
        const cacheCtx = document.getElementById('cacheChart').getContext('2d');
        this.cacheChart = new Chart(cacheCtx, {
            type: 'doughnut',
            data: {
                labels: ['Hits', 'Misses'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)'
                    ]
                }]
            }
        });

        // Branch Prediction Chart
        const branchCtx = document.getElementById('branchChart').getContext('2d');
        this.branchChart = new Chart(branchCtx, {
            type: 'bar',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    label: 'Branch Predictions',
                    data: [0, 0],
                    backgroundColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)'
                    ]
                }]
            }
        });
    }

    initializeControls() {
        document.getElementById('start').addEventListener('click', () => this.start());
        document.getElementById('stop').addEventListener('click', () => this.stop());
        document.getElementById('step').addEventListener('click', () => this.step());
        document.getElementById('reset').addEventListener('click', () => this.reset());
    }

    updatePipelineDisplay(stageData) {
        const stages = ['fetch', 'decode', 'execute', 'memory', 'writeback'];
        stages.forEach(stage => {
            const element = document.querySelector(`#${stage} .stage-content`);
            element.textContent = stageData[stage] || 'Empty';
        });
    }

    updatePerformanceMetrics() {
        // Update IPC
        const currentIPC = Math.random() * 2; // Simulate IPC calculation
        this.performanceData.ipc.push(currentIPC);
        
        // Update cache statistics
        if (Math.random() > 0.3) {
            this.performanceData.cacheHits++;
        } else {
            this.performanceData.cacheMisses++;
        }

        // Update branch prediction statistics
        if (Math.random() > 0.2) {
            this.performanceData.branchPredictions.correct++;
        } else {
            this.performanceData.branchPredictions.incorrect++;
        }

        this.updateCharts();
    }

    updateCharts() {
        // Update IPC Chart
        this.ipcChart.data.labels = Array.from(
            {length: this.performanceData.ipc.length}, 
            (_, i) => `Cycle ${i}`
        );
        this.ipcChart.data.datasets[0].data = this.performanceData.ipc;
        this.ipcChart.update();

        // Update Cache Chart
        this.cacheChart.data.datasets[0].data = [
            this.performanceData.cacheHits,
            this.performanceData.cacheMisses
        ];
        this.cacheChart.update();

        // Update Branch Prediction Chart
        this.branchChart.data.datasets[0].data = [
            this.performanceData.branchPredictions.correct,
            this.performanceData.branchPredictions.incorrect
        ];
        this.branchChart.update();
    }

    updateRegisters(registerData) {
        const registerDisplay = document.getElementById('register-display');
        registerDisplay.innerHTML = '';
        
        for (let i = 0; i < 32; i++) {
            const value = registerData ? registerData[i] : 0;
            const reg = document.createElement('div');
            reg.className = 'register';
            reg.textContent = `x${i}: ${value.toString(16).padStart(8, '0')}`;
            registerDisplay.appendChild(reg);
        }
    }

    start() {
        this.running = true;
        this.run();
    }

    stop() {
        this.running = false;
    }

    step() {
        this.simulateCycle();
    }

    reset() {
        this.cycle = 0;
        this.performanceData = {
            ipc: [],
            cacheHits: 0,
            cacheMisses: 0,
            branchPredictions: {
                correct: 0,
                incorrect: 0
            }
        };
        this.updateCharts();
        this.updatePipelineDisplay({});
        this.updateRegisters(null);
    }

    simulateCycle() {
        this.cycle++;
        
        // Simulate pipeline stages
        const stageData = {
            fetch: `Instruction ${this.cycle}`,
            decode: `Decoded Instr ${this.cycle - 1}`,
            execute: `Executing Instr ${this.cycle - 2}`,
            memory: `Memory Access ${this.cycle - 3}`,
            writeback: `Writeback ${this.cycle - 4}`
        };
        
        this.updatePipelineDisplay(stageData);
        this.updatePerformanceMetrics();
        
        // Simulate register updates
        const registerData = Array.from(
            {length: 32}, 
            () => Math.floor(Math.random() * 0xFFFFFFFF)
        );
        this.updateRegisters(registerData);
    }

    run() {
        if (this.running) {
            this.simulateCycle();
            setTimeout(() => this.run(), 1000); // Run every second
        }
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cpuVisualizer = new CPUVisualizer();
});
