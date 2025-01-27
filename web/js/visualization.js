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

    log(message, type = 'info', details = {}) {
        const logDisplay = document.getElementById('log-display');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        
        let logContent = `[${timestamp}] ${message}\n`;
        if (Object.keys(details).length > 0) {
            logContent += Object.entries(details)
                .map(([key, value]) => `    ${key}: ${value}`)
                .join('\n');
        }
        
        entry.textContent = logContent;
        logDisplay.appendChild(entry);
        logDisplay.scrollTop = logDisplay.scrollHeight;
    }

    getHazardInfo() {
        return {
            data_hazards: this.performanceData.dataHazards || 0,
            control_hazards: this.performanceData.controlHazards || 0,
            structural_hazards: this.performanceData.structuralHazards || 0,
            forwarding_events: this.performanceData.forwardingEvents || 0
        };
    }

    getCacheStats() {
        const total = this.performanceData.cacheHits + this.performanceData.cacheMisses;
        const hitRate = total > 0 ? (this.performanceData.cacheHits / total * 100).toFixed(2) : 0;
        return {
            hits: this.performanceData.cacheHits,
            misses: this.performanceData.cacheMisses,
            hit_rate: `${hitRate}%`,
            miss_penalty_cycles: 10 // Assuming 10 cycle penalty
        };
    }

    getBranchStats() {
        const total = this.performanceData.branchPredictions.correct + 
                     this.performanceData.branchPredictions.incorrect;
        const accuracy = total > 0 ? 
            (this.performanceData.branchPredictions.correct / total * 100).toFixed(2) : 0;
        return {
            correct_predictions: this.performanceData.branchPredictions.correct,
            incorrect_predictions: this.performanceData.branchPredictions.incorrect,
            accuracy: `${accuracy}%`,
            misprediction_penalty: 3 // Assuming 3 cycle penalty
        };
    }

    simulateCycle() {
        this.cycle++;
        this.log(`\n=== Starting Cycle ${this.cycle} ===`, 'cycle');
        
        // Simulate pipeline stages
        const stageData = {
            fetch: `Instruction ${this.cycle}`,
            decode: `Decoded Instr ${this.cycle - 1}`,
            execute: `Executing Instr ${this.cycle - 2}`,
            memory: `Memory Access ${this.cycle - 3}`,
            writeback: `Writeback ${this.cycle - 4}`
        };

        // Detailed Fetch Stage Logging
        const fetchDetails = {
            pc_value: this.cycle * 4,
            instruction_address: `0x${(this.cycle * 4).toString(16).padStart(8, '0')}`,
            instruction_cache_status: Math.random() > 0.9 ? 'MISS' : 'HIT',
            btb_lookup: 'No branch predicted',
            fetch_bandwidth: '4 bytes/cycle'
        };
        this.log('Fetch Stage Details:', 'fetch', fetchDetails);

        // Detailed Decode Stage Logging
        if (this.cycle > 1) {
            const decodeDetails = {
                instruction_type: ['R-type', 'I-type', 'S-type', 'B-type', 'U-type', 'J-type'][Math.floor(Math.random() * 6)],
                source_registers: 'x1, x2',
                destination_register: 'x3',
                immediate_value: '0x0000BEEF',
                control_signals: 'RegWrite=1, MemRead=0, MemWrite=0, Branch=0',
                register_file_access: 'Reading registers...'
            };
            this.log('Decode Stage Details:', 'decode', decodeDetails);
        }

        // Detailed Execute Stage Logging
        if (this.cycle > 2) {
            const executeDetails = {
                alu_operation: 'ADD/SUB/AND/OR/XOR'[Math.floor(Math.random() * 5)],
                operand1: '0x12345678',
                operand2: '0x87654321',
                forwarding_used: Math.random() > 0.5 ? 'Yes (EX/MEM -> EX)' : 'No',
                branch_condition: 'Not taken',
                execution_latency: '1 cycle'
            };
            this.log('Execute Stage Details:', 'execute', executeDetails);
        }

        // Detailed Memory Stage Logging
        if (this.cycle > 3) {
            const memoryDetails = {
                operation_type: Math.random() > 0.5 ? 'Load' : 'Store',
                memory_address: `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')}`,
                data_size: '4 bytes',
                cache_status: this.getCacheStats(),
                memory_latency: '2 cycles'
            };
            this.log('Memory Stage Details:', 'memory', memoryDetails);
        }

        // Detailed Writeback Stage Logging
        if (this.cycle > 4) {
            const writebackDetails = {
                destination_register: `x${Math.floor(Math.random() * 32)}`,
                written_value: `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')}`,
                writeback_source: Math.random() > 0.5 ? 'ALU Result' : 'Memory Data',
                bypass_network: 'Active to Execute stage'
            };
            this.log('Writeback Stage Details:', 'writeback', writebackDetails);
        }

        // Log Hazard and Performance Information
        const hazardInfo = this.getHazardInfo();
        this.log('Pipeline Hazards:', 'hazard', hazardInfo);

        const branchStats = this.getBranchStats();
        this.log('Branch Prediction Stats:', 'branch', branchStats);

        // Log Overall Performance Metrics
        const performanceMetrics = {
            cycles_completed: this.cycle,
            instructions_completed: Math.floor(this.cycle * 0.8),
            current_ipc: (this.cycle * 0.8 / this.cycle).toFixed(2),
            cpi: (this.cycle / (this.cycle * 0.8)).toFixed(2),
            pipeline_efficiency: `${(Math.random() * 20 + 80).toFixed(2)}%`,
            stall_cycles: Math.floor(this.cycle * 0.2),
            bubble_cycles: Math.floor(this.cycle * 0.1)
        };
        this.log('Performance Metrics:', 'performance', performanceMetrics);
        
        this.updatePipelineDisplay(stageData);
        this.updatePerformanceMetrics();
        
        // Simulate and log register updates
        const registerData = Array.from(
            {length: 32}, 
            () => Math.floor(Math.random() * 0xFFFFFFFF)
        );
        this.updateRegisters(registerData);
        
        // Log performance metrics
        const currentIPC = this.performanceData.ipc[this.performanceData.ipc.length - 1];
        this.log(`Performance Metrics:`);
        this.log(`  - Current IPC: ${currentIPC.toFixed(2)}`);
        this.log(`  - Cache Hits/Misses: ${this.performanceData.cacheHits}/${this.performanceData.cacheMisses}`);
        this.log(`  - Branch Predictions: ${this.performanceData.branchPredictions.correct} correct, ${this.performanceData.branchPredictions.incorrect} incorrect`);
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
