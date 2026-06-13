using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IntelliMedi.API.Migrations
{
    /// <inheritdoc />
    public partial class TipologiaVisite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "TipologieVisita",
                columns: new[] { "Id", "Descrizione" },
                values: new object[,]
                {
                    { 1, "Visita sportiva" },
                    { 2, "Ortopedia" },
                    { 3, "Nutrizione" },
                    { 4, "Cardiologia" },
                    { 5, "Psicologia" },
                    { 6, "Fisioterapia" },
                    { 7, "Holter cardiaco" },
                    { 8, "Onde d'urto" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "TipologieVisita",
                keyColumn: "Id",
                keyValue: 8);
        }
    }
}
