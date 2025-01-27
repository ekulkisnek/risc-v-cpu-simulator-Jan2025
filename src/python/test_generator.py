#!/usr/bin/env python3

import random
from typing import List, Tuple

class RISCVTestGenerator:
    def __init__(self):
        self.instructions = {
            'add': lambda rd, rs1, rs2: f"add x{rd}, x{rs1}, x{rs2}",
            'sub': lambda rd, rs1, rs2: f"sub x{rd}, x{rs1}, x{rs2}",
            'and': lambda rd, rs1, rs2: f"and x{rd}, x{rs1}, x{rs2}",
            'or':  lambda rd, rs1, rs2: f"or x{rd}, x{rs1}, x{rs2}",
            'xor': lambda rd, rs1, rs2: f"xor x{rd}, x{rs1}, x{rs2}",
        }

    def generate_random_instruction(self) -> str:
        """Generate a random RISC-V instruction"""
        instr = random.choice(list(self.instructions.keys()))
        rd = random.randint(0, 31)
        rs1 = random.randint(0, 31)
        rs2 = random.randint(0, 31)
        return self.instructions[instr](rd, rs1, rs2)

    def generate_test_sequence(self, length: int) -> List[str]:
        """Generate a sequence of random instructions"""
        return [self.generate_random_instruction() for _ in range(length)]

    def generate_matrix_mul_test(self, matrix_size: int = 4) -> Tuple[List[List[int]], List[List[int]]]:
        """Generate test matrices for matrix multiplication"""
        matrix_a = [[random.randint(0, 255) for _ in range(matrix_size)] 
                   for _ in range(matrix_size)]
        matrix_b = [[random.randint(0, 255) for _ in range(matrix_size)] 
                   for _ in range(matrix_size)]
        return matrix_a, matrix_b

    def write_test_to_file(self, filename: str, test_sequence: List[str]):
        """Write test sequence to file"""
        with open(filename, 'w') as f:
            f.write('\n'.join(test_sequence))

def main():
    # Initialize test generator
    generator = RISCVTestGenerator()
    
    # Generate basic instruction tests
    basic_tests = generator.generate_test_sequence(100)
    generator.write_test_to_file('basic_test.s', basic_tests)
    
    # Generate matrix multiplication tests
    matrix_a, matrix_b = generator.generate_matrix_mul_test()
    print("Matrix A:", matrix_a)
    print("Matrix B:", matrix_b)

if __name__ == "__main__":
    main()
