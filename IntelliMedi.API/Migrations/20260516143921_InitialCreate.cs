using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliMedi.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Medici",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Cognome = table.Column<string>(type: "TEXT", nullable: false),
                    CodiceFiscale = table.Column<string>(type: "TEXT", nullable: true),
                    DataNascita = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Sesso = table.Column<int>(type: "INTEGER", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medici", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pazienti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Cognome = table.Column<string>(type: "TEXT", nullable: false),
                    CodiceFiscale = table.Column<string>(type: "TEXT", nullable: true),
                    DataNascita = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Sesso = table.Column<int>(type: "INTEGER", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pazienti", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TipologieVisita",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Descrizione = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TipologieVisita", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DisponibilitaMedici",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MedicoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Giorno = table.Column<int>(type: "INTEGER", nullable: false),
                    OraInizio = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    OraFine = table.Column<TimeOnly>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DisponibilitaMedici", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DisponibilitaMedici_Medici_MedicoId",
                        column: x => x.MedicoId,
                        principalTable: "Medici",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Recensioni",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PazienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    MedicoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Voto = table.Column<int>(type: "INTEGER", nullable: false),
                    Descrizione = table.Column<string>(type: "TEXT", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "Appuntamenti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Data = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TipologiaVisitaId = table.Column<int>(type: "INTEGER", nullable: false),
                    PazienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    MedicoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Descrizione = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appuntamenti", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appuntamenti_Medici_MedicoId",
                        column: x => x.MedicoId,
                        principalTable: "Medici",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appuntamenti_Pazienti_PazienteId",
                        column: x => x.PazienteId,
                        principalTable: "Pazienti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appuntamenti_TipologieVisita_TipologiaVisitaId",
                        column: x => x.TipologiaVisitaId,
                        principalTable: "TipologieVisita",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedicoTipologiaVisita",
                columns: table => new
                {
                    MediciId = table.Column<int>(type: "INTEGER", nullable: false),
                    TipologiaVisiteId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicoTipologiaVisita", x => new { x.MediciId, x.TipologiaVisiteId });
                    table.ForeignKey(
                        name: "FK_MedicoTipologiaVisita_Medici_MediciId",
                        column: x => x.MediciId,
                        principalTable: "Medici",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedicoTipologiaVisita_TipologieVisita_TipologiaVisiteId",
                        column: x => x.TipologiaVisiteId,
                        principalTable: "TipologieVisita",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appuntamenti_MedicoId",
                table: "Appuntamenti",
                column: "MedicoId");

            migrationBuilder.CreateIndex(
                name: "IX_Appuntamenti_PazienteId",
                table: "Appuntamenti",
                column: "PazienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Appuntamenti_TipologiaVisitaId",
                table: "Appuntamenti",
                column: "TipologiaVisitaId");

            migrationBuilder.CreateIndex(
                name: "IX_DisponibilitaMedici_MedicoId",
                table: "DisponibilitaMedici",
                column: "MedicoId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicoTipologiaVisita_TipologiaVisiteId",
                table: "MedicoTipologiaVisita",
                column: "TipologiaVisiteId");

            migrationBuilder.CreateIndex(
                name: "IX_Recensioni_MedicoId",
                table: "Recensioni",
                column: "MedicoId");

            migrationBuilder.CreateIndex(
                name: "IX_Recensioni_PazienteId",
                table: "Recensioni",
                column: "PazienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appuntamenti");

            migrationBuilder.DropTable(
                name: "DisponibilitaMedici");

            migrationBuilder.DropTable(
                name: "MedicoTipologiaVisita");

            migrationBuilder.DropTable(
                name: "Recensioni");

            migrationBuilder.DropTable(
                name: "TipologieVisita");

            migrationBuilder.DropTable(
                name: "Medici");

            migrationBuilder.DropTable(
                name: "Pazienti");
        }
    }
}
