// RISC-V Pipeline Implementation
`timescale 1ns / 1ps

module pipeline (
    input wire clk,
    input wire rst_n,
    input wire [31:0] instruction_in,
    input wire [31:0] data_memory_in,
    output reg [31:0] pc_out,
    output reg [31:0] alu_result_out,
    output reg [31:0] data_memory_addr,
    output reg data_memory_write_en,
    output reg data_memory_read_en,
    output reg [31:0] data_memory_write_data
);

    // Pipeline registers
    reg [31:0] if_id_pc;
    reg [31:0] if_id_instruction;
    
    reg [31:0] id_ex_pc;
    reg [31:0] id_ex_reg1_data;
    reg [31:0] id_ex_reg2_data;
    reg [31:0] id_ex_immediate;
    reg [4:0]  id_ex_rd;
    reg [2:0]  id_ex_funct3;
    reg [6:0]  id_ex_funct7;
    reg [3:0]  id_ex_alu_control;
    reg        id_ex_mem_read;
    reg        id_ex_mem_write;
    reg        id_ex_reg_write;
    
    reg [31:0] ex_mem_alu_result;
    reg [31:0] ex_mem_reg2_data;
    reg [4:0]  ex_mem_rd;
    reg        ex_mem_mem_read;
    reg        ex_mem_mem_write;
    reg        ex_mem_reg_write;
    
    reg [31:0] mem_wb_data;
    reg [4:0]  mem_wb_rd;
    reg        mem_wb_reg_write;

    // Register file
    reg [31:0] registers [31:0];

    // Hazard detection
    reg stall;
    wire data_hazard;
    wire control_hazard;

    // Forwarding unit signals
    reg [1:0] forward_a;
    reg [1:0] forward_b;

    // ALU signals
    wire [31:0] alu_operand_a;
    wire [31:0] alu_operand_b;
    wire [31:0] alu_result;
    wire alu_zero;

    // Instruction decode signals
    wire [6:0] opcode;
    wire [4:0] rs1, rs2, rd;
    wire [2:0] funct3;
    wire [6:0] funct7;
    wire [31:0] immediate;

    assign opcode = if_id_instruction[6:0];
    assign rd = if_id_instruction[11:7];
    assign funct3 = if_id_instruction[14:12];
    assign rs1 = if_id_instruction[19:15];
    assign rs2 = if_id_instruction[24:20];
    assign funct7 = if_id_instruction[31:25];

    // Immediate generation
    immediate_gen imm_gen (
        .instruction(if_id_instruction),
        .immediate(immediate)
    );

    // ALU instantiation
    alu alu_unit (
        .a(alu_operand_a),
        .b(alu_operand_b),
        .op(id_ex_alu_control),
        .result(alu_result),
        .zero(alu_zero)
    );

    // Hazard detection unit
    hazard_detection hazard_unit (
        .id_ex_mem_read(id_ex_mem_read),
        .id_ex_rd(id_ex_rd),
        .if_id_rs1(rs1),
        .if_id_rs2(rs2),
        .stall(stall)
    );

    // Forwarding unit
    forwarding_unit forward_unit (
        .ex_mem_reg_write(ex_mem_reg_write),
        .mem_wb_reg_write(mem_wb_reg_write),
        .ex_mem_rd(ex_mem_rd),
        .mem_wb_rd(mem_wb_rd),
        .id_ex_rs1(id_ex_rd),
        .id_ex_rs2(rs2),
        .forward_a(forward_a),
        .forward_b(forward_b)
    );

    // Pipeline stages
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            // Reset all pipeline registers
            if_id_pc <= 32'b0;
            if_id_instruction <= 32'b0;
            id_ex_pc <= 32'b0;
            id_ex_reg1_data <= 32'b0;
            id_ex_reg2_data <= 32'b0;
            id_ex_immediate <= 32'b0;
            id_ex_rd <= 5'b0;
            id_ex_funct3 <= 3'b0;
            id_ex_funct7 <= 7'b0;
            id_ex_alu_control <= 4'b0;
            id_ex_mem_read <= 1'b0;
            id_ex_mem_write <= 1'b0;
            id_ex_reg_write <= 1'b0;
            ex_mem_alu_result <= 32'b0;
            ex_mem_reg2_data <= 32'b0;
            ex_mem_rd <= 5'b0;
            ex_mem_mem_read <= 1'b0;
            ex_mem_mem_write <= 1'b0;
            ex_mem_reg_write <= 1'b0;
            mem_wb_data <= 32'b0;
            mem_wb_rd <= 5'b0;
            mem_wb_reg_write <= 1'b0;
        end else begin
            if (!stall) begin
                // Instruction Fetch Stage
                if_id_pc <= pc_out;
                if_id_instruction <= instruction_in;
                pc_out <= pc_out + 4;

                // Instruction Decode Stage
                id_ex_pc <= if_id_pc;
                id_ex_reg1_data <= registers[rs1];
                id_ex_reg2_data <= registers[rs2];
                id_ex_immediate <= immediate;
                id_ex_rd <= rd;
                id_ex_funct3 <= funct3;
                id_ex_funct7 <= funct7;
                id_ex_alu_control <= get_alu_control(opcode, funct3, funct7);
                id_ex_mem_read <= (opcode == 7'b0000011);  // Load
                id_ex_mem_write <= (opcode == 7'b0100011); // Store
                id_ex_reg_write <= (opcode != 7'b0100011); // Not store

                // Execute Stage
                case (forward_a)
                    2'b00: alu_operand_a = id_ex_reg1_data;
                    2'b01: alu_operand_a = ex_mem_alu_result;
                    2'b10: alu_operand_a = mem_wb_data;
                    default: alu_operand_a = id_ex_reg1_data;
                endcase

                case (forward_b)
                    2'b00: alu_operand_b = id_ex_reg2_data;
                    2'b01: alu_operand_b = ex_mem_alu_result;
                    2'b10: alu_operand_b = mem_wb_data;
                    default: alu_operand_b = id_ex_reg2_data;
                endcase

                ex_mem_alu_result <= alu_result;
                ex_mem_reg2_data <= id_ex_reg2_data;
                ex_mem_rd <= id_ex_rd;
                ex_mem_mem_read <= id_ex_mem_read;
                ex_mem_mem_write <= id_ex_mem_write;
                ex_mem_reg_write <= id_ex_reg_write;

                // Memory Stage
                data_memory_addr <= ex_mem_alu_result;
                data_memory_write_en <= ex_mem_mem_write;
                data_memory_read_en <= ex_mem_mem_read;
                data_memory_write_data <= ex_mem_reg2_data;
                mem_wb_data <= ex_mem_mem_read ? data_memory_in : ex_mem_alu_result;
                mem_wb_rd <= ex_mem_rd;
                mem_wb_reg_write <= ex_mem_reg_write;

                // Writeback Stage
                if (mem_wb_reg_write && mem_wb_rd != 5'b0) begin
                    registers[mem_wb_rd] <= mem_wb_data;
                end
            end
        end
    end

    // ALU control function
    function [3:0] get_alu_control;
        input [6:0] opcode;
        input [2:0] funct3;
        input [6:0] funct7;
        begin
            case (opcode)
                7'b0110011: // R-type
                    case (funct3)
                        3'b000: get_alu_control = (funct7[5]) ? 4'b0001 : 4'b0000; // SUB : ADD
                        3'b001: get_alu_control = 4'b0010; // SLL
                        3'b010: get_alu_control = 4'b0011; // SLT
                        3'b011: get_alu_control = 4'b0100; // SLTU
                        3'b100: get_alu_control = 4'b0101; // XOR
                        3'b101: get_alu_control = (funct7[5]) ? 4'b0111 : 4'b0110; // SRA : SRL
                        3'b110: get_alu_control = 4'b1000; // OR
                        3'b111: get_alu_control = 4'b1001; // AND
                        default: get_alu_control = 4'b0000;
                    endcase
                7'b0010011: // I-type
                    case (funct3)
                        3'b000: get_alu_control = 4'b0000; // ADDI
                        3'b010: get_alu_control = 4'b0011; // SLTI
                        3'b011: get_alu_control = 4'b0100; // SLTIU
                        3'b100: get_alu_control = 4'b0101; // XORI
                        3'b110: get_alu_control = 4'b1000; // ORI
                        3'b111: get_alu_control = 4'b1001; // ANDI
                        default: get_alu_control = 4'b0000;
                    endcase
                default: get_alu_control = 4'b0000;
            endcase
        end
    endfunction

endmodule

// Hazard Detection Unit
module hazard_detection (
    input wire id_ex_mem_read,
    input wire [4:0] id_ex_rd,
    input wire [4:0] if_id_rs1,
    input wire [4:0] if_id_rs2,
    output reg stall
);
    always @(*) begin
        stall = id_ex_mem_read && 
                (id_ex_rd == if_id_rs1 || id_ex_rd == if_id_rs2);
    end
endmodule

// Forwarding Unit
module forwarding_unit (
    input wire ex_mem_reg_write,
    input wire mem_wb_reg_write,
    input wire [4:0] ex_mem_rd,
    input wire [4:0] mem_wb_rd,
    input wire [4:0] id_ex_rs1,
    input wire [4:0] id_ex_rs2,
    output reg [1:0] forward_a,
    output reg [1:0] forward_b
);
    always @(*) begin
        // Forward A
        if (ex_mem_reg_write && ex_mem_rd != 0 && ex_mem_rd == id_ex_rs1)
            forward_a = 2'b01;
        else if (mem_wb_reg_write && mem_wb_rd != 0 && mem_wb_rd == id_ex_rs1)
            forward_a = 2'b10;
        else
            forward_a = 2'b00;

        // Forward B
        if (ex_mem_reg_write && ex_mem_rd != 0 && ex_mem_rd == id_ex_rs2)
            forward_b = 2'b01;
        else if (mem_wb_reg_write && mem_wb_rd != 0 && mem_wb_rd == id_ex_rs2)
            forward_b = 2'b10;
        else
            forward_b = 2'b00;
    end
endmodule

// Immediate Generation Unit
module immediate_gen (
    input wire [31:0] instruction,
    output reg [31:0] immediate
);
    wire [6:0] opcode;
    assign opcode = instruction[6:0];

    always @(*) begin
        case (opcode)
            7'b0010011: immediate = {{20{instruction[31]}}, instruction[31:20]}; // I-type
            7'b0100011: immediate = {{20{instruction[31]}}, instruction[31:25], instruction[11:7]}; // S-type
            7'b1100011: immediate = {{19{instruction[31]}}, instruction[31], instruction[7], instruction[30:25], instruction[11:8], 1'b0}; // B-type
            7'b0110111: immediate = {instruction[31:12], 12'b0}; // U-type
            7'b1101111: immediate = {{11{instruction[31]}}, instruction[31], instruction[19:12], instruction[20], instruction[30:21], 1'b0}; // J-type
            default: immediate = 32'b0;
        endcase
    end
endmodule
