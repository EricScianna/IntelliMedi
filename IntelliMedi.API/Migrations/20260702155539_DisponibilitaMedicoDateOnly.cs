using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliMedi.API.Migrations
{
    /// <inheritdoc />
    public partial class DisponibilitaMedicoDateOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "Data",
                table: "DisponibilitaMedici",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Data",
                table: "DisponibilitaMedici");
        }
    }
}
