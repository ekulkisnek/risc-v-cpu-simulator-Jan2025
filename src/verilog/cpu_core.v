// RISC-V CPU Core Implementation
`timescale 1ns / 1ps

module cpu_core (
    input wire clk,
    input wire rst_n,
    input wire [31:0] instruction,
    output reg [31:0] pc,
    output reg [31:0] result
);

    // Internal registers
    reg [31:0] registers [31:0];
    reg [31:0] pipeline_reg_if_id;
    reg [31:0] pipeline_reg_id_ex;
    reg [31:0] pipeline_reg_ex_mem;
    reg [31:0] pipeline_reg_mem_wb;

    // Pipeline control signals
    reg stall;
    reg flush;

    // Instruction decode
    wire [6:0] opcode;
    wire [4:0] rd, rs1, rs2;
    wire [2:0] funct3;
    wire [6:0] funct7;

    assign opcode = instruction[6:0];
    assign rd = instruction[11:7];
    assign funct3 = instruction[14:12];
    assign rs1 = instruction[19:15];
    assign rs2 = instruction[24:20];
    assign funct7 = instruction[31:25];

    // ALU instantiation
    wire [31:0] alu_result;
    wire alu_zero;

    alu alu_unit (
        .a(registers[rs1]),
        .b(registers[rs2]),
        .op(funct3),
        .result(alu_result),
        .zero(alu_zero)
    );

    // Pipeline stages
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            pc <= 32'h0;
            result <= 32'h0;
            stall <= 1'b0;
            flush <= 1'b0;
        end else begin
            if (!stall) begin
                // Instruction Fetch
                pipeline_reg_if_id <= instruction;
                pc <= pc + 4;

                // Instruction Decode
                pipeline_reg_id_ex <= pipeline_reg_if_id;

                // Execute
                pipeline_reg_ex_mem <= alu_result;

                // Memory
                pipeline_reg_mem_wb <= pipeline_reg_ex_mem;

                // Writeback
                if (rd != 5'b0) begin
                    registers[rd] <= pipeline_reg_mem_wb;
                end
            end
        end
    end

endmodule
