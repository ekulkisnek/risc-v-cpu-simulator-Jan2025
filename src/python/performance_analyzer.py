#!/usr/bin/env python3

import json
from typing import Dict, List
from dataclasses import dataclass
import matplotlib.pyplot as plt
import io

@dataclass
class PerformanceMetrics:
    cycles: int
    ipc: float
    cache_hits: int
    cache_misses: int
    branch_predictions: int
    branch_mispredictions: int
    power_consumption: float  # Watts
    thermal_density: float    # W/mm²
    chiplet_utilization: float  # Percentage

class CPUPerformanceAnalyzer:
    def __init__(self):
        self.metrics: Dict[str, PerformanceMetrics] = {}
        self.timeline: List[Dict] = []

    def record_cycle(self, cycle_data: Dict):
        """Record performance data for a single cycle"""
        self.timeline.append(cycle_data)
        
    def analyze_performance(self) -> PerformanceMetrics:
        """Analyze collected performance data"""
        total_cycles = len(self.timeline)
        total_instructions = sum(1 for cycle in self.timeline if cycle.get('instruction_completed'))
        
        cache_hits = sum(1 for cycle in self.timeline if cycle.get('cache_hit'))
        cache_misses = sum(1 for cycle in self.timeline if cycle.get('cache_miss'))
        
        branch_predictions = sum(1 for cycle in self.timeline if cycle.get('branch_taken') is not None)
        branch_mispredictions = sum(1 for cycle in self.timeline 
                                  if cycle.get('branch_taken') != cycle.get('branch_actual'))
        
        ipc = total_instructions / total_cycles if total_cycles > 0 else 0
        
        return PerformanceMetrics(
            cycles=total_cycles,
            ipc=ipc,
            cache_hits=cache_hits,
            cache_misses=cache_misses,
            branch_predictions=branch_predictions,
            branch_mispredictions=branch_mispredictions
        )

    def generate_performance_report(self) -> str:
        """Generate a detailed performance report"""
        metrics = self.analyze_performance()
        
        report = [
            "CPU Performance Analysis Report",
            "===========================",
            f"Total Cycles: {metrics.cycles}",
            f"Instructions Per Cycle (IPC): {metrics.ipc:.2f}",
            f"Cache Hit Rate: {metrics.cache_hits/(metrics.cache_hits + metrics.cache_misses):.2%}",
            f"Branch Prediction Accuracy: {(metrics.branch_predictions - metrics.branch_mispredictions)/metrics.branch_predictions:.2%}",
        ]
        
        return "\n".join(report)

    def generate_visualization(self) -> str:
        """Generate performance visualization"""
        metrics = self.analyze_performance()
        
        # Create performance graphs using matplotlib
        plt.figure(figsize=(10, 6))
        plt.subplot(2, 1, 1)
        plt.title("Cache Performance")
        plt.pie([metrics.cache_hits, metrics.cache_misses], 
                labels=['Hits', 'Misses'],
                autopct='%1.1f%%')
        
        plt.subplot(2, 1, 2)
        plt.title("Branch Prediction Accuracy")
        plt.bar(['Correct', 'Incorrect'], 
                [metrics.branch_predictions - metrics.branch_mispredictions,
                 metrics.branch_mispredictions])
        
        # Save plot to a string buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='svg')
        plt.close()
        
        return buf.getvalue().decode('utf-8')

def main():
    analyzer = CPUPerformanceAnalyzer()
    
    # Simulate some performance data
    for i in range(100):
        analyzer.record_cycle({
            'cycle': i,
            'instruction_completed': True,
            'cache_hit': random.choice([True, False]),
            'branch_taken': random.choice([True, False]),
            'branch_actual': random.choice([True, False])
        })
    
    # Generate and print report
    print(analyzer.generate_performance_report())

if __name__ == "__main__":
    import random
    main()
