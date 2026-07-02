using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliMedi.API.Migrations
{
    /// <inheritdoc />
    public partial class RimuoviRecensioni : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Recensioni");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Recensioni",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MedicoId = table.Column<int>(type: "INTEGER", nullable: false),
                    PazienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    Descrizione = table.Column<string>(type: "TEXT", nullable: true),
                    Voto = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recensioni", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Recensioni_Medici_MedicoId",
                        column: x => x.MedicoId,
                        principalTable: "Medici",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Recensioni_Pazienti_PazienteId",
                        column: x => x.PazienteId,
                        principalTable: "Pazienti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Recensioni_MedicoId",
                table: "Recensioni",
                column: "MedicoId");

            migrationBuilder.CreateIndex(
                name: "IX_Recensioni_PazienteId",
                table: "Recensioni",
                column: "PazienteId");
        }
    }
}
